import type { AuthPort, OnboardingPort, OnboardingProfileInput } from "@gynecology-chatbot/app-core";
import {
  completeMockOnboarding,
  createMockVerificationRequest,
  readMockMobileRuntime,
  signInMockUser,
} from "../mockMobileRuntime";

export class MockAuthPortAdapter implements AuthPort {
  async requestPhoneVerification(input: { phoneNumber: string }) {
    createMockVerificationRequest(input.phoneNumber);
  }

  async signInWithPhoneVerification(input: {
    phoneNumber: string;
    verificationCode: string;
  }) {
    const currentUser = readMockMobileRuntime().currentUser;
    const expectedPhoneNumber = currentUser?.phoneNumber ?? "010-2345-6789";

    if (input.phoneNumber !== expectedPhoneNumber || input.verificationCode.trim().length < 4) {
      throw new Error("인증 코드를 확인해 주세요.");
    }

    return signInMockUser(input.phoneNumber);
  }
}

export class MockOnboardingPortAdapter implements OnboardingPort {
  async completeProfile(input: OnboardingProfileInput) {
    return completeMockOnboarding(input);
  }
}
