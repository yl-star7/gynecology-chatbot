import type {
  AuthenticatedUser,
  OnboardingProfileInput,
} from "@gynecology-chatbot/app-core";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  fetchCurrentMobileSession,
  readCurrentMobileSessionToken,
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
        const brandingSync = services.profilePort
          .getBranding()
          .then((branding) => syncNurseImageCache(branding.characterImages))
          .catch(() => undefined);
        if (payload.user.id === nativeUserId) {
          await nativeCacheHydration;
        } else {
          await Promise.all([
            nativeCacheHydration,
            hydratePatientViewCaches(payload.user.id),
          ]);
        }
        if (!cancelled) {
          storeCurrentMobileUserId(payload.user.id);
          setCurrentUser(payload.user);
        }
        if (shouldPersistRestoredToken) {
          await persistNativeSessionToken(persistedToken);
        }
        await persistNativeUserId(payload.user.id);
        await brandingSync;
      } catch {
        if (cancelled) {
          return;
        }

        storeCurrentMobileSessionToken(null);
        storeCurrentMobileUserId(null);
        clearPatientViewCaches(nativeUserId);
        await clearPersistedPatientViewCaches(nativeUserId);
        await clearNativeSessionToken();
        await clearNativeUserId();
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
  }, [services.profilePort]);

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
        clearPatientViewCaches(currentUser?.id);
        await clearPersistedPatientViewCaches(currentUser?.id);
        storeCurrentMobileSessionToken(null);
        storeCurrentMobileUserId(null);
        await clearNativeSessionToken();
        await clearNativeUserId();
        setCurrentUser(null);
        setIsRestoringSession(false);
      },
    }),
    [currentUser, isRestoringSession, services],
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
