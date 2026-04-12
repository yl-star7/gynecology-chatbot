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
  clearNativeSessionToken,
  persistNativeSessionToken,
  readNativeSessionToken,
} from "./nativeSessionStorage";

interface MobileAppSessionValue {
  currentUser: AuthenticatedUser | null;
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

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (currentUser) {
        return;
      }

      const inMemoryToken = readCurrentMobileSessionToken();
      const persistedToken = inMemoryToken ?? (await readNativeSessionToken());

      if (!persistedToken) {
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
        if (!cancelled) {
          storeCurrentMobileSessionToken(null);
          storeCurrentMobileUserId(null);
          await clearNativeSessionToken();
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
      async requestVerificationCode(input) {
        await services.authPort.requestPhoneVerification(input);
      },
      async signIn(input) {
        const nextUser =
          await services.authPort.signInWithPhoneVerification(input);
        const sessionToken = readCurrentMobileSessionToken();
        if (sessionToken) {
          await persistNativeSessionToken(sessionToken);
        }
        storeCurrentMobileUserId(nextUser.id);
        setCurrentUser(nextUser);
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
      },
    }),
    [currentUser, services],
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
