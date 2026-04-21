import type {
  AuthPort,
  KnowledgePort,
  MobileContentListItem,
  MobilePregnancyWeekSummary,
  MobileChatPort,
  MobileHomePort,
  MobileProfileViewData,
  MobileProfilePort,
  MobileRecordsPort,
  OnboardingPort,
  TodayPort,
} from "@gynecology-chatbot/app-core";
import type { MobileApiClient } from "../../api/mobileApi.ts";
import { createTodayIsoDate } from "../mobileBootstrap.model.ts";
import {
  cacheChatSession,
  cacheHomeView,
  cachePregnancyWeeks,
  cacheProfileView,
  cacheRecentChats,
  cacheRecordDayView,
  cacheTodayView,
  clearCachedChatSession,
  clearCachedHomeView,
  clearCachedRecentChats,
  clearCachedRecordDayView,
  hasFreshCachedChatSession,
  hasFreshCachedRecentChats,
  hasFreshCachedRecordDayView,
  readCachedChatSession,
  readCachedRecentChats,
  readCachedRecordDayView,
} from "../patientViewCache";

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
  private readonly getUserId: () => string;

  constructor(client: MobileApiClient, getUserId: () => string) {
    this.client = client;
    this.getUserId = getUserId;
  }

  async getHomeView() {
    const payload = await this.client.fetchHome();
    cacheHomeView(this.getUserId(), payload.home);
    return payload.home;
  }

  async getRecordDay(isoDate: string) {
    const userId = this.getUserId();
    if (hasFreshCachedRecordDayView(userId, isoDate)) {
      const cached = readCachedRecordDayView(userId, isoDate);
      if (cached) {
        return cached;
      }
    }

    const payload = await this.client.fetchRecordDay(isoDate);
    cacheRecordDayView(userId, isoDate, payload.recordDay);
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
  private readonly getUserId: () => string;

  constructor(client: MobileApiClient, getUserId: () => string) {
    this.client = client;
    this.getUserId = getUserId;
  }

  async getTodayView() {
    const payload = await this.client.fetchTodayView();
    cacheTodayView(this.getUserId(), payload.today);
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
  private readonly getUserId: () => string;

  constructor(client: MobileApiClient, getUserId: () => string) {
    this.client = client;
    this.getUserId = getUserId;
  }

  async listRecentChats() {
    const userId = this.getUserId();
    if (hasFreshCachedRecentChats(userId)) {
      const cached = readCachedRecentChats(userId);
      if (cached) {
        return cached;
      }
    }

    const payload = await this.client.fetchSessions();
    cacheRecentChats(userId, payload.sessions);
    return payload.sessions;
  }

  async getSession(sessionId?: string) {
    const resolvedSessionId = sessionId ?? "new";
    const userId = this.getUserId();
    if (
      resolvedSessionId !== "new" &&
      hasFreshCachedChatSession(userId, resolvedSessionId)
    ) {
      const cached = readCachedChatSession(userId, resolvedSessionId);
      if (cached) {
        return cached;
      }
    }
    const payload = await this.client.fetchSession(resolvedSessionId);
    if (resolvedSessionId !== "new") {
      cacheChatSession(userId, resolvedSessionId, payload.session);
    }
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
    const userId = this.getUserId();

    clearCachedRecentChats(userId);
    clearCachedRecordDayView(userId, createTodayIsoDate());
    clearCachedHomeView(userId);
    clearCachedChatSession(userId, input.sessionId);

    return payload.assistantMessages ?? [payload.assistantMessage];
  }

  async resolveLink(target: string, entityId?: string) {
    const payload = await this.client.fetchLinkTarget(target, entityId);
    return payload.content;
  }

  async summarizeSession(sessionId: string) {
    const result = await this.client.summarizeChatSession(sessionId);
    if (result.summarized) {
      const userId = this.getUserId();
      clearCachedRecentChats(userId);
      clearCachedRecordDayView(userId, createTodayIsoDate());
    }
    return result;
  }
}

export class ApiKnowledgeAdapter implements KnowledgePort {
  private readonly client: MobileApiClient;
  private readonly getUserId: () => string;

  constructor(client: MobileApiClient, getUserId: () => string) {
    this.client = client;
    this.getUserId = getUserId;
  }

  async listContentItems(
    section: "knowledge" | "notebook",
  ): Promise<MobileContentListItem[]> {
    const payload = await this.client.fetchContentItems(section);
    return payload.items;
  }

  async listPregnancyWeeks(): Promise<MobilePregnancyWeekSummary[]> {
    const userId = this.getUserId();
    const payload = await this.client.fetchPregnancyWeeks();
    cachePregnancyWeeks(userId, payload.weeks);
    return payload.weeks;
  }

  async getLinkTarget(target: string, entityId?: string) {
    const payload = await this.client.fetchLinkTarget(target, entityId);
    return payload.content;
  }
}

export class ApiMobileProfileAdapter implements MobileProfilePort {
  private readonly client: MobileApiClient;
  private readonly getUserId: () => string;

  constructor(client: MobileApiClient, getUserId: () => string) {
    this.client = client;
    this.getUserId = getUserId;
  }

  async getProfile() {
    const payload = await this.client.fetchMobileProfile();
    cacheProfileView(this.getUserId(), payload.profile);
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
