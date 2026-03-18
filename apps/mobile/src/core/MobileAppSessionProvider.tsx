import type { AuthenticatedUser, OnboardingProfileInput } from "@gynecology-chatbot/app-core";
import { createContext, useContext, useMemo, useState } from "react";
import { storeCurrentMobileSessionToken } from "../api/mobileApi";
import { useMobileServices } from "./MobileServicesProvider";
import { clearMockMobileCurrentUser, readMockMobileRuntime } from "./mockMobileRuntime";

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

const MobileAppSessionContext = createContext<MobileAppSessionValue | null>(null);

export function MobileAppSessionProvider({ children }: { children: React.ReactNode }) {
  const services = useMobileServices();
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(readMockMobileRuntime().currentUser);

  const value = useMemo<MobileAppSessionValue>(
    () => ({
      currentUser,
      async requestVerificationCode(input) {
        await services.authPort.requestPhoneVerification(input);
      },
      async signIn(input) {
        const nextUser = await services.authPort.signInWithPhoneVerification(
          input,
        );
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
        clearMockMobileCurrentUser();
        setCurrentUser(null);
      },
    }),
    [currentUser, services],
  );

  return <MobileAppSessionContext.Provider value={value}>{children}</MobileAppSessionContext.Provider>;
}

export function useMobileAppSession() {
  const value = useContext(MobileAppSessionContext);
  if (!value) {
    throw new Error("useMobileAppSession must be used within MobileAppSessionProvider");
  }

  return value;
}
