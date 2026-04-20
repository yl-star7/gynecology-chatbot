import type {
  AdminDashboardData,
  AdminRagDocumentDetail,
  AdminRagDocumentInput,
  AdminWeekDetail,
  AdminWeekSummary,
  AdminWeekUpdateInput,
  AdminKnowledgeItem,
  AdminKnowledgeItemInput,
  AdminWorkflowRule,
  AdminWorkflowRuleInput,
  AuthenticatedUser,
  ChatComposerInput,
  ChatSession,
  ChatMessage,
  HomeViewData,
  MobileContentListItem,
  MobilePregnancyWeekSummary,
  LinkTargetContent,
  MobileProfileViewData,
  OnboardingProfileInput,
  AdminAllowedPhoneNumber,
  RecentChatSummary,
  RecordDayView,
  TodayViewData,
} from "./domain";

export interface AuthPort {
  requestPhoneVerification(input: { phoneNumber: string }): Promise<void>;
  signInWithPhoneVerification(input: {
    phoneNumber: string;
    verificationCode: string;
  }): Promise<AuthenticatedUser>;
}

export interface OnboardingPort {
  completeProfile(input: OnboardingProfileInput): Promise<AuthenticatedUser>;
}

export interface MobileHomePort {
  getHomeView(): Promise<HomeViewData>;
  getRecordDay(isoDate: string): Promise<RecordDayView>;
}

export interface MobileRecordsPort {
  saveSurveyResponse(input: {
    questionId: string;
    answer: string;
  }): Promise<void>;
}

export interface TodayPort {
  getTodayView(): Promise<TodayViewData>;
  markInfoViewed(): Promise<void>;
  setChecklistItemCompleted(input: {
    checklistId: string;
    completed: boolean;
  }): Promise<void>;
}

export interface CalendarPort {
  getHomeCalendar(input: {
    month: string;
  }): Promise<HomeViewData["calendarDays"]>;
}

export interface KnowledgePort {
  listContentItems(
    section: "knowledge" | "notebook",
  ): Promise<MobileContentListItem[]>;
  listPregnancyWeeks(): Promise<MobilePregnancyWeekSummary[]>;
  getLinkTarget(target: string, entityId?: string): Promise<LinkTargetContent>;
}

export interface MobileChatPort {
  listRecentChats(): Promise<RecentChatSummary[]>;
  getSession(sessionId?: string): Promise<ChatSession>;
  sendMessage(input: ChatComposerInput): Promise<ChatMessage[]>;
  resolveLink(target: string, entityId?: string): Promise<LinkTargetContent>;
  summarizeSession(
    sessionId: string,
  ): Promise<{ summarized: boolean; summary?: string; reason?: string }>;
}

export interface MobileProfilePort {
  getProfile(): Promise<MobileProfileViewData>;
  getBranding(): Promise<{
    surveyFormUrl: string | null;
  }>;
  updateProfile(input: {
    userId: string;
    displayName: string;
    dueDate?: string | null;
    tonePreference: string;
    babyNickname?: string | null;
    hospitalName?: string | null;
    notificationTime?: string | null;
    themeKey?: MobileProfileViewData["themeKey"];
  }): Promise<AuthenticatedUser>;
  submitSurveyAnswer(input: {
    userId: string;
    questionId: string;
    answer: string;
  }): Promise<void>;
}

export interface AdminDashboardPort {
  getDashboard(): Promise<AdminDashboardData>;
}

export interface AdminUserPort {
  listUsers(): Promise<AdminDashboardData["managedUsers"]>;
  listAllowedPhoneNumbers(): Promise<AdminAllowedPhoneNumber[]>;
  updatePhoneNumber(input: {
    actorId?: string;
    userId: string;
    phoneNumber: string;
    reason: string;
  }): Promise<void>;
  createAllowedPhoneNumber(input: {
    actorId?: string;
    phoneNumber: string;
    displayName?: string | null;
    note?: string | null;
  }): Promise<AdminAllowedPhoneNumber>;
  updateAllowedPhoneNumber(input: {
    actorId?: string;
    id: string;
    phoneNumber: string;
    displayName?: string | null;
    note?: string | null;
  }): Promise<AdminAllowedPhoneNumber>;
  deleteAllowedPhoneNumber(input: {
    actorId?: string;
    id: string;
  }): Promise<void>;
  resetSession(input: {
    actorId?: string;
    userId: string;
    reason: string;
  }): Promise<void>;
  updateUserStatus(input: {
    actorId?: string;
    userId: string;
    status: "active" | "paused";
    reason: string;
  }): Promise<void>;
}

export interface AdminContentPort {
  createDocument(
    input: AdminRagDocumentInput,
    actorId?: string,
  ): Promise<AdminRagDocumentDetail>;
  getDocument(documentId: string): Promise<AdminRagDocumentDetail | null>;
  updateDocument(
    documentId: string,
    input: AdminRagDocumentInput,
    actorId?: string,
  ): Promise<AdminRagDocumentDetail | null>;
  deleteDocument(documentId: string, actorId?: string): Promise<void>;
  updateWorkflowRule(
    id: string,
    input: AdminWorkflowRuleInput,
    actorId?: string,
  ): Promise<AdminWorkflowRule | null>;
  listKnowledgeItems(): Promise<AdminKnowledgeItem[]>;
  createKnowledgeItem(
    input: AdminKnowledgeItemInput,
    actorId?: string,
  ): Promise<AdminKnowledgeItem>;
  updateKnowledgeItem(
    id: string,
    input: AdminKnowledgeItemInput,
    actorId?: string,
  ): Promise<AdminKnowledgeItem | null>;
  deleteKnowledgeItem(id: string, actorId?: string): Promise<void>;
  listWeeks(): Promise<AdminWeekSummary[]>;
  getWeek(weekNumber: number): Promise<AdminWeekDetail | null>;
  saveWeek(
    weekNumber: number,
    input: AdminWeekUpdateInput,
    actorId?: string,
  ): Promise<AdminWeekDetail | null>;
}
