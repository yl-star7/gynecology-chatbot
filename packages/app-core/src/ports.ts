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
  MobileProfileViewData,
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

export interface MobileProfilePort {
  getProfile(): Promise<MobileProfileViewData>;
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
}

export interface AdminDashboardPort {
  getDashboard(): Promise<AdminDashboardData>;
}

export interface AdminUserPort {
  listUsers(): Promise<AdminDashboardData["managedUsers"]>;
  updatePhoneNumber(input: {
    actorId?: string;
    userId: string;
    phoneNumber: string;
    reason: string;
  }): Promise<void>;
  resetPassword(input: {
    actorId?: string;
    userId: string;
    reason: string;
  }): Promise<void>;
}

export interface AdminContentPort {
  listWeeks(): Promise<AdminWeekSummary[]>;
  getWeek(weekNumber: number): Promise<AdminWeekDetail | null>;
  saveWeek(
    weekNumber: number,
    input: AdminWeekUpdateInput,
  ): Promise<AdminWeekDetail | null>;
}
