import type {
  AdminDashboardData,
  AdminWeekDetail,
  AdminWeekSummary,
  AdminWeekUpdateInput,
  AuthenticatedUser,
  ChatComposerInput,
  ChatSession,
  ChatMessage,
  HomeViewData,
  LinkTargetContent,
  OnboardingProfileInput,
  RecentChatSummary,
} from "./domain";

export interface AuthPort {
  signInWithPhonePassword(input: {
    phoneNumber: string;
    password: string;
  }): Promise<AuthenticatedUser>;
  verifyPhone(input: {
    phoneNumber: string;
    verificationCode: string;
  }): Promise<{ verificationToken: string }>;
  setPassword(input: {
    verificationToken: string;
    password: string;
  }): Promise<AuthenticatedUser>;
  requestPasswordReset(input: { phoneNumber: string }): Promise<void>;
}

export interface OnboardingPort {
  completeProfile(input: OnboardingProfileInput): Promise<AuthenticatedUser>;
}

export interface MobileHomePort {
  getHomeView(): Promise<HomeViewData>;
}

export interface CalendarPort {
  getHomeCalendar(input: {
    month: string;
  }): Promise<HomeViewData["calendarDays"]>;
}

export interface KnowledgePort {
  getLinkTarget(target: string, entityId?: string): Promise<LinkTargetContent>;
}

export interface MobileChatPort {
  listRecentChats(): Promise<RecentChatSummary[]>;
  getSession(sessionId?: string): Promise<ChatSession>;
  sendMessage(input: ChatComposerInput): Promise<ChatMessage>;
  resolveLink(target: string, entityId?: string): Promise<LinkTargetContent>;
}

export interface AdminDashboardPort {
  getDashboard(): Promise<AdminDashboardData>;
}

export interface AdminUserPort {
  listUsers(): Promise<AdminDashboardData["managedUsers"]>;
  updatePhoneNumber(input: {
    userId: string;
    phoneNumber: string;
    reason: string;
  }): Promise<void>;
  resetPassword(input: { userId: string; reason: string }): Promise<void>;
}

export interface AdminContentPort {
  listWeeks(): Promise<AdminWeekSummary[]>;
  getWeek(weekNumber: number): Promise<AdminWeekDetail | null>;
  saveWeek(
    weekNumber: number,
    input: AdminWeekUpdateInput,
  ): Promise<AdminWeekDetail | null>;
}
