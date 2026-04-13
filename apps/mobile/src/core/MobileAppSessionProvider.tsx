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
  getDevelopmentAutoVerifiedLogin,
  isDevelopmentAutoVerifiedPhoneNumber,
} from "../screens/auth/LoginScreen.model";
import {
  clearNativeSessionToken,
  persistNativeSessionToken,
  readNativeSessionToken,
} from "./nativeSessionStorage";

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
      if (currentUser) {
        if (!cancelled) {
          setIsRestoringSession(false);
        }
        return;
      }

      const inMemoryToken = readCurrentMobileSessionToken();
      const persistedToken =
        inMemoryToken ??
        (await readNativeSessionToken()) ??
        (__DEV__ ? process.env.EXPO_PUBLIC_DEV_SESSION_TOKEN : null) ??
        null;

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
        }
      } catch {
        if (cancelled) {
          return;
        }

        storeCurrentMobileSessionToken(null);
        storeCurrentMobileUserId(null);
        await clearNativeSessionToken();

        if (!__DEV__) {
          if (!cancelled) {
            setIsRestoringSession(false);
          }
          return;
        }

        const fallbackLogin = getDevelopmentAutoVerifiedLogin();
        if (!isDevelopmentAutoVerifiedPhoneNumber(fallbackLogin.phoneNumber)) {
          if (!cancelled) {
            setIsRestoringSession(false);
          }
          return;
        }

        try {
          const nextUser =
            await services.authPort.signInWithPhoneVerification(fallbackLogin);
          const nextToken = readCurrentMobileSessionToken();
          if (nextToken) {
            await persistNativeSessionToken(nextToken);
          }
          if (!cancelled) {
            storeCurrentMobileUserId(nextUser.id);
            setCurrentUser(nextUser);
          }
        } catch {
          if (!cancelled) {
            storeCurrentMobileSessionToken(null);
            storeCurrentMobileUserId(null);
            await clearNativeSessionToken();
          }
        }
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
  }, [currentUser]);

  const value = useMemo<MobileAppSessionValue>(
    () => ({
      currentUser,
      isRestoringSession,
      async requestVerificationCode(input) {
        await services.authPort.requestPhoneVerification(input);
      },
      async signIn(input) {
        setIsRestoringSession(true);
        const nextUser =
          await services.authPort.signInWithPhoneVerification(input);
        const sessionToken = readCurrentMobileSessionToken();
        if (sessionToken) {
          await persistNativeSessionToken(sessionToken);
        }
        storeCurrentMobileUserId(nextUser.id);
        setCurrentUser(nextUser);
        setIsRestoringSession(false);
        return nextUser;
      },
      async completeOnboarding(input) {
        const nextUser = await services.onboardingPort.completeProfile(input);
        setCurrentUser(nextUser);
        return nextUser;
      },
      async signOut() {
        storeCurrentMobileSessionToken(null);
        storeCurrentMobileUserId(null);
        await clearNativeSessionToken();
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
