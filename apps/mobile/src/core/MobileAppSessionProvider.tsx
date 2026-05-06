import type {
  AuthenticatedUser,
  OnboardingProfileInput,
} from "@gynecology-chatbot/app-core";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  fetchCurrentMobileSession,
  readCurrentMobileSessionToken,
  setMobileSessionExpiredHandler,
  storeCurrentMobileSessionToken,
  storeCurrentMobileUserId,
} from "../api/mobileApi";
import { useMobileServices } from "./MobileServicesProvider";
import {
  clearPatientViewCaches,
  clearPersistedPatientViewCaches,
  hydratePatientViewCaches,
} from "./patientViewCache";
import {
  clearNativeSessionToken,
  clearNativeUserId,
  persistNativeSessionToken,
  persistNativeUserId,
  readNativeSessionToken,
  readNativeUserId,
} from "./nativeSessionStorage";
import { syncNurseImageCache } from "./nurseImageCache";

interface MobileAppSessionValue {
  currentUser: AuthenticatedUser | null;
  isRestoringSession: boolean;
  requestVerificationCode(input: { phoneNumber: string }): Promise<void>;
  signIn(input: {
    phoneNumber: string;
    verificationCode: string;
  }): Promise<AuthenticatedUser>;
  refreshCurrentUser(): Promise<AuthenticatedUser>;
  completeOnboarding(input: OnboardingProfileInput): Promise<AuthenticatedUser>;
  signOut(): Promise<void>;
}

const MobileAppSessionContext = createContext<MobileAppSessionValue | null>(
  null,
);

export function MobileAppSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const services = useMobileServices();
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(
    null,
  );
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    currentUserIdRef.current = currentUser?.id ?? null;
  }, [currentUser?.id]);

  const clearSessionState = useCallback(async () => {
    const nativeUserId = await readNativeUserId();
    const userId = currentUserIdRef.current ?? nativeUserId;

    clearPatientViewCaches(userId);
    await clearPersistedPatientViewCaches(userId);
    storeCurrentMobileSessionToken(null);
    storeCurrentMobileUserId(null);
    await clearNativeSessionToken();
    await clearNativeUserId();
    setCurrentUser(null);
    setIsRestoringSession(false);
  }, []);

  useEffect(() => {
    setMobileSessionExpiredHandler(clearSessionState);

    return () => {
      setMobileSessionExpiredHandler(null);
    };
  }, [clearSessionState]);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const inMemoryToken = readCurrentMobileSessionToken();
      const [nativeToken, nativeUserId] = await Promise.all([
        readNativeSessionToken(),
        readNativeUserId(),
      ]);

      const nativeCacheHydration = nativeUserId
        ? hydratePatientViewCaches(nativeUserId)
        : Promise.resolve();

      const persistedToken = inMemoryToken ?? nativeToken ?? null;
      const shouldPersistRestoredToken =
        Boolean(persistedToken) && persistedToken !== nativeToken;

      if (!persistedToken) {
        if (!cancelled) {
          setIsRestoringSession(false);
        }
        return;
      }

      storeCurrentMobileSessionToken(persistedToken);

      try {
        const payload = await fetchCurrentMobileSession();
        if (!cancelled) {
          storeCurrentMobileUserId(payload.user.id);
          setCurrentUser(payload.user);
          setIsRestoringSession(false);
        }

        const backgroundTasks: Promise<unknown>[] = [
          nativeCacheHydration,
          persistNativeUserId(payload.user.id),
          services.profilePort
            .getBranding()
            .then((branding) => syncNurseImageCache(branding.characterImages)),
        ];

        if (payload.user.id !== nativeUserId) {
          backgroundTasks.push(hydratePatientViewCaches(payload.user.id));
        }

        if (shouldPersistRestoredToken) {
          backgroundTasks.push(persistNativeSessionToken(persistedToken));
        }

        void Promise.allSettled(backgroundTasks);
      } catch {
        if (cancelled) {
          return;
        }

        await clearSessionState();
      } finally {
        if (!cancelled) {
          setIsRestoringSession(false);
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [clearSessionState, services.profilePort]);

  const value = useMemo<MobileAppSessionValue>(
    () => ({
      currentUser,
      isRestoringSession,
      async requestVerificationCode(input) {
        await services.authPort.requestPhoneVerification(input);
      },
      async signIn(input) {
        const nextUser =
          await services.authPort.signInWithPhoneVerification(input);
        const sessionToken = readCurrentMobileSessionToken();

        storeCurrentMobileUserId(nextUser.id);
        setCurrentUser(nextUser);
        setIsRestoringSession(false);

        if (sessionToken) {
          void persistNativeSessionToken(sessionToken);
        }
        void persistNativeUserId(nextUser.id);
        void hydratePatientViewCaches(nextUser.id);
        void services.profilePort
          .getBranding()
          .then((branding) => syncNurseImageCache(branding.characterImages))
          .catch(() => undefined);

        return nextUser;
      },
      async refreshCurrentUser() {
        const payload = await fetchCurrentMobileSession();
        storeCurrentMobileUserId(payload.user.id);
        setCurrentUser(payload.user);
        setIsRestoringSession(false);
        void persistNativeUserId(payload.user.id);
        return payload.user;
      },
      async completeOnboarding(input) {
        const nextUser = await services.onboardingPort.completeProfile(input);
        await persistNativeUserId(nextUser.id);
        setCurrentUser(nextUser);
        void services.profilePort
          .getBranding()
          .then((branding) => syncNurseImageCache(branding.characterImages))
          .catch(() => undefined);
        return nextUser;
      },
      async signOut() {
        await clearSessionState();
      },
    }),
    [clearSessionState, currentUser, isRestoringSession, services],
  );

  return (
    <MobileAppSessionContext.Provider value={value}>
      {children}
    </MobileAppSessionContext.Provider>
  );
}

export function useMobileAppSession() {
  const value = useContext(MobileAppSessionContext);
  if (!value) {
    throw new Error(
      "useMobileAppSession must be used within MobileAppSessionProvider",
    );
  }

  return value;
}
