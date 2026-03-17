import type { AuthPort, OnboardingPort, OnboardingProfileInput } from "@gynecology-chatbot/app-core";
import {
  completeMockOnboarding,
  readMockMobileRuntime,
  setMockPasswordUser,
  signInMockUser,
} from "../mockMobileRuntime";

let mockPassword = "pass1234";
const verificationToken = "verified-token";

export class MockAuthPortAdapter implements AuthPort {
  async signInWithPhonePassword(input: { phoneNumber: string; password: string }) {
    const currentUser = readMockMobileRuntime().currentUser;
    const expectedPhoneNumber = currentUser?.phoneNumber ?? "010-2345-6789";

    if (input.phoneNumber !== expectedPhoneNumber || input.password !== mockPassword) {
      throw new Error("전화번호 또는 비밀번호가 맞지 않습니다.");
    }

    return signInMockUser(input.phoneNumber);
  }

  async verifyPhone(input: { phoneNumber: string; verificationCode: string }) {
    const currentUser = readMockMobileRuntime().currentUser;
    const expectedPhoneNumber = currentUser?.phoneNumber ?? "010-2345-6789";

    if (input.phoneNumber !== expectedPhoneNumber || input.verificationCode.trim().length < 4) {
      throw new Error("인증 코드를 확인해 주세요.");
    }

    return { verificationToken };
  }

  async setPassword(input: { verificationToken: string; password: string }) {
    if (input.verificationToken !== verificationToken) {
      throw new Error("인증 세션이 만료되었습니다.");
    }

    mockPassword = input.password;
    return setMockPasswordUser(readMockMobileRuntime().currentUser?.phoneNumber ?? "010-2345-6789");
  }

  async requestPasswordReset(input: { phoneNumber: string }) {
    const currentUser = readMockMobileRuntime().currentUser;
    const expectedPhoneNumber = currentUser?.phoneNumber ?? "010-2345-6789";

    if (input.phoneNumber !== expectedPhoneNumber) {
      throw new Error("등록된 전화번호를 찾을 수 없습니다.");
    }
  }
}

export class MockOnboardingPortAdapter implements OnboardingPort {
  async completeProfile(input: OnboardingProfileInput) {
    return completeMockOnboarding(input);
  }
}
