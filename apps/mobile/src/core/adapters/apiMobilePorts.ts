import type {
  AuthPort,
  EmotionTone,
  KnowledgePort,
  MobileContentListItem,
  MobileChatPort,
  MobileHomePort,
  MobileProfileViewData,
  MobileProfilePort,
  MobileRecordsPort,
  OnboardingPort,
  TodayPort,
} from "@gynecology-chatbot/app-core";
import type { MobileApiClient } from "../../api/mobileApi.ts";

export class ApiMobileAuthAdapter implements AuthPort {
  private readonly client: MobileApiClient;

  constructor(client: MobileApiClient) {
    this.client = client;
  }

  async requestPhoneVerification(input: { phoneNumber: string }) {
    await this.client.requestPhoneVerification(input);
  }

  async signInWithPhoneVerification(input: {
    phoneNumber: string;
    verificationCode: string;
  }) {
    const payload = await this.client.signInWithPhoneVerification(input);
    return payload.user;
  }
}

export class ApiOnboardingAdapter implements OnboardingPort {
  private readonly client: MobileApiClient;
  private readonly getUserId: () => string;

  constructor(client: MobileApiClient, getUserId: () => string) {
    this.client = client;
    this.getUserId = getUserId;
  }

  async completeProfile(input: {
    pregnancyWeekOrDueDate: string;
    tonePreference: string;
  }) {
    const payload = await this.client.completeOnboarding({
      userId: this.getUserId(),
      ...input,
    });
    return payload.user;
  }
}

export class ApiMobileHomeAdapter implements MobileHomePort {
  private readonly client: MobileApiClient;

  constructor(client: MobileApiClient) {
    this.client = client;
  }

  async getHomeView() {
    const payload = await this.client.fetchHome();
    return payload.home;
  }

  async getRecordDay(isoDate: string) {
    const payload = await this.client.fetchRecordDay(isoDate);
    return payload.recordDay;
  }
}

export class ApiMobileRecordsAdapter implements MobileRecordsPort {
  private readonly client: MobileApiClient;
  private readonly getUserId: () => string;

  constructor(client: MobileApiClient, getUserId: () => string) {
    this.client = client;
    this.getUserId = getUserId;
  }

  async saveEmotionCheckin(input: {
    sessionId: string;
    emotionTone: EmotionTone;
  }) {
    await this.client.saveEmotionCheckin({
      userId: this.getUserId(),
      sessionId: input.sessionId,
      emotionTone: input.emotionTone,
    });
  }

  async saveSurveyResponse(input: { questionId: string; answer: string }) {
    await this.client.submitProfileSurveyAnswer({
      userId: this.getUserId(),
      questionId: input.questionId,
      answer: input.answer,
    });
  }
}

export class ApiTodayAdapter implements TodayPort {
  private readonly client: MobileApiClient;

  constructor(client: MobileApiClient) {
    this.client = client;
  }

  async getTodayView() {
    const payload = await this.client.fetchTodayView();
    return payload.today;
  }

  async markInfoViewed() {
    await this.client.markTodayInfoViewed();
  }

  async setChecklistItemCompleted(input: {
    checklistId: string;
    completed: boolean;
  }) {
    await this.client.updateTodayChecklistItem(input);
  }
}

export class ApiMobileChatAdapter implements MobileChatPort {
  private readonly client: MobileApiClient;

  constructor(client: MobileApiClient) {
    this.client = client;
  }

  async listRecentChats() {
    const payload = await this.client.fetchSessions();
    return payload.sessions;
  }

  async getSession(sessionId?: string) {
    const payload = await this.client.fetchSession(sessionId ?? "new");
    return payload.session;
  }

  async sendMessage(input: {
    sessionId: string;
    text: string;
    imageUris: string[];
    pregnancyWeek?: number;
  }) {
    const payload = await this.client.sendChatMessage({
      sessionId: input.sessionId,
      text: input.text,
      pregnancyWeek: input.pregnancyWeek,
      imageDataUris: input.imageUris,
    });

    return payload.assistantMessages ?? [payload.assistantMessage];
  }

  async resolveLink(target: string, entityId?: string) {
    const payload = await this.client.fetchLinkTarget(target, entityId);
    return payload.content;
  }
}

export class ApiKnowledgeAdapter implements KnowledgePort {
  private readonly client: MobileApiClient;

  constructor(client: MobileApiClient) {
    this.client = client;
  }

  async listContentItems(
    section: "knowledge" | "notebook",
  ): Promise<MobileContentListItem[]> {
    const payload = await this.client.fetchContentItems(section);
    return payload.items;
  }

  async getLinkTarget(target: string, entityId?: string) {
    const payload = await this.client.fetchLinkTarget(target, entityId);
    return payload.content;
  }
}

export class ApiMobileProfileAdapter implements MobileProfilePort {
  private readonly client: MobileApiClient;

  constructor(client: MobileApiClient) {
    this.client = client;
  }

  async getProfile() {
    const payload = await this.client.fetchMobileProfile();
    return payload.profile;
  }

  async getBranding() {
    return this.client.fetchMobileBranding();
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

  async submitSurveyAnswer(input: {
    userId: string;
    questionId: string;
    answer: string;
  }) {
    await this.client.submitProfileSurveyAnswer(input);
  }
}
