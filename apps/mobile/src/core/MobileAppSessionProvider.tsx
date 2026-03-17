import type { AuthenticatedUser, OnboardingProfileInput } from "@gynecology-chatbot/app-core";
import { createContext, useContext, useMemo, useState } from "react";
import { useMobileServices } from "./MobileServicesProvider";
import { readMockMobileRuntime } from "./mockMobileRuntime";

interface MobileAppSessionValue {
  currentUser: AuthenticatedUser | null;
  signIn(input: { phoneNumber: string; password: string }): Promise<AuthenticatedUser>;
  setPassword(input: { phoneNumber: string; verificationCode: string; password: string }): Promise<AuthenticatedUser>;
  requestPasswordReset(input: { phoneNumber: string }): Promise<void>;
  completeOnboarding(input: OnboardingProfileInput): Promise<AuthenticatedUser>;
}

const MobileAppSessionContext = createContext<MobileAppSessionValue | null>(null);

export function MobileAppSessionProvider({ children }: { children: React.ReactNode }) {
  const services = useMobileServices();
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(readMockMobileRuntime().currentUser);

  const value = useMemo<MobileAppSessionValue>(
    () => ({
      currentUser,
      async signIn(input) {
        const nextUser = await services.authPort.signInWithPhonePassword(input);
        setCurrentUser(nextUser);
        return nextUser;
      },
      async setPassword(input) {
        const verification = await services.authPort.verifyPhone({
          phoneNumber: input.phoneNumber,
          verificationCode: input.verificationCode,
        });
        const nextUser = await services.authPort.setPassword({
          verificationToken: verification.verificationToken,
          password: input.password,
        });
        setCurrentUser(nextUser);
        return nextUser;
      },
      async requestPasswordReset(input) {
        await services.authPort.requestPasswordReset(input);
      },
      async completeOnboarding(input) {
        const nextUser = await services.onboardingPort.completeProfile(input);
        setCurrentUser(nextUser);
        return nextUser;
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
