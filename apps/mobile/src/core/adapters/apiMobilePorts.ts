import type {
  AuthPort,
  KnowledgePort,
  MobileChatPort,
  MobileHomePort,
  MobileProfileViewData,
  MobileProfilePort,
  OnboardingPort,
} from "@gynecology-chatbot/app-core";
import type { MobileApiClient } from "../../api/mobileApi";

export class ApiMobileAuthAdapter implements AuthPort {
  constructor(private readonly client: MobileApiClient) {}

  async signInWithPhonePassword(input: { phoneNumber: string; password: string }) {
    const payload = await this.client.signInWithPhonePassword(input);
    return payload.user;
  }

  async verifyPhone(input: { phoneNumber: string; verificationCode: string }) {
    return this.client.verifyPhone(input);
  }

  async setPassword(input: { verificationToken: string; password: string }) {
    const payload = await this.client.setPassword(input);
    return payload.user;
  }

  async requestPasswordReset(input: { phoneNumber: string }) {
    await this.client.requestPasswordReset(input);
  }
}

export class ApiOnboardingAdapter implements OnboardingPort {
  constructor(
    private readonly client: MobileApiClient,
    private readonly getUserId: () => string,
  ) {}

  async completeProfile(input: { pregnancyWeekOrDueDate: string; tonePreference: string }) {
    const payload = await this.client.completeOnboarding({
      userId: this.getUserId(),
      ...input,
    });
    return payload.user;
  }
}

export class ApiMobileHomeAdapter implements MobileHomePort {
  constructor(private readonly client: MobileApiClient) {}

  async getHomeView() {
    const payload = await this.client.fetchHome();
    return payload.home;
  }
}

export class ApiMobileChatAdapter implements MobileChatPort {
  constructor(private readonly client: MobileApiClient) {}

  async listRecentChats() {
    const payload = await this.client.fetchSessions();
    return payload.sessions;
  }

  async getSession(sessionId?: string) {
    const payload = await this.client.fetchSession(sessionId ?? "new");
    return payload.session;
  }

  async sendMessage(input: { sessionId: string; text: string; imageUris: string[]; pregnancyWeek?: number }) {
    const payload = await this.client.sendChatMessage({
      sessionId: input.sessionId,
      text: input.text,
      pregnancyWeek: input.pregnancyWeek,
      imageDataUris: input.imageUris,
    });

    return payload.assistantMessage;
  }

  async resolveLink(target: string, entityId?: string) {
    const payload = await this.client.fetchLinkTarget(target, entityId);
    return payload.content;
  }
}

export class ApiKnowledgeAdapter implements KnowledgePort {
  constructor(private readonly client: MobileApiClient) {}

  async getLinkTarget(target: string, entityId?: string) {
    const payload = await this.client.fetchLinkTarget(target, entityId);
    return payload.content;
  }
}

export class ApiMobileProfileAdapter implements MobileProfilePort {
  constructor(private readonly client: MobileApiClient) {}

  async getProfile() {
    const payload = await this.client.fetchMobileProfile();
    return payload.profile;
  }

  async updateProfile(input: {
    userId: string;
    displayName: string;
    dueDate?: string | null;
    tonePreference: string;
    babyNickname?: string | null;
    hospitalName?: string | null;
    notificationTime?: string | null;
    themeKey?: MobileProfileViewData["themeKey"];
  }) {
    const payload = await this.client.updateMobileProfile(input);
    return payload.user;
  }
}
