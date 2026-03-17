export type EmotionTone = "calm" | "joyful" | "anxious" | "tired" | "sad";

export interface CalendarDay {
  isoDate: string;
  dayLabel: string;
  hasChat: boolean;
  emotionTone: EmotionTone | null;
  summary?: string;
}

export interface HomeShortcutCard {
  id: string;
  title: string;
  description: string;
  href: string;
}

export interface HomeViewData {
  userName: string;
  pregnancyDayCount: number;
  pregnancyWeekLabel: string;
  currentMonthLabel: string;
  calendarDays: CalendarDay[];
  notebookCard: HomeShortcutCard;
  knowledgeCard: HomeShortcutCard;
}

export interface RecentChatSummary {
  id: string;
  title: string;
  preview: string;
  updatedAtLabel: string;
}

export interface RecordDayItem {
  id: string;
  title: string;
  summary?: string;
  entryType: string;
  linkedSessionId?: string | null;
}

export interface RecordDayView {
  isoDate: string;
  dateLabel: string;
  emotionTone: EmotionTone | null;
  records: RecordDayItem[];
  relatedSessions: RecentChatSummary[];
}

export interface SurveyChoice {
  id: string;
  label: string;
}

export interface SurveyPart {
  type: "survey";
  id: string;
  title: string;
  body: string;
  choices: SurveyChoice[];
}

export interface CarouselCardItem {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
}

export interface CarouselPart {
  type: "carousel";
  id: string;
  title: string;
  cards: CarouselCardItem[];
}

export interface TextPart {
  type: "text";
  id: string;
  text: string;
}

export interface ImagePart {
  type: "image";
  id: string;
  imageUrl: string;
  alt: string;
  caption?: string;
}

export interface DeepLinkPart {
  type: "deepLink";
  id: string;
  title: string;
  description: string;
  target: string;
  entityId?: string;
}

export type ChatPart = TextPart | SurveyPart | CarouselPart | ImagePart | DeepLinkPart;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  createdAtLabel: string;
  parts: ChatPart[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
}

export interface ChatComposerInput {
  sessionId: string;
  text: string;
  imageUris: string[];
  pregnancyWeek?: number;
}

export interface LinkTargetContent {
  title: string;
  section: string;
  body: string;
  ctaLabel?: string;
}

export interface AuthenticatedUser {
  id: string;
  phoneNumber: string;
  displayName: string;
  hasCompletedOnboarding: boolean;
}

export interface MobileProfileViewData {
  userId: string;
  displayName: string;
  phoneNumber: string;
  pregnancyWeekLabel: string;
  pregnancyDayCount: number;
  accountStatus: string;
  hasCompletedOnboarding: boolean;
  dueDate?: string | null;
  tonePreference?: string | null;
  pregnancyWeekOrDueDate?: string | null;
  babyNickname?: string | null;
  hospitalName?: string | null;
  notificationTime?: string | null;
}

export interface OnboardingProfileInput {
  pregnancyWeekOrDueDate: string;
  tonePreference: string;
}

export interface AdminMetric {
  id: string;
  label: string;
  value: string;
  changeLabel: string;
}

export interface AdminManagedUser {
  id: string;
  name: string;
  phoneNumber: string;
  status: "active" | "attention" | "paused";
  latestIssue: string;
}

export interface AdminRecoveryAction {
  id: string;
  userName: string;
  action: string;
  requestedAt: string;
  status: "pending" | "completed";
}

export interface AdminRagDocument {
  id: string;
  title: string;
  pregnancyWeekLabel: string;
  category: string;
  chunkCount: number;
  updatedAt: string;
  status: "ready" | "draft";
}

export interface AdminWorkflowRule {
  id: string;
  name: string;
  trigger: string;
  retrievalScope: string;
  modelName: string;
  status: "active" | "review";
}

export interface AdminHistoryMessage {
  id: string;
  role: "user" | "assistant";
  createdAtLabel: string;
  summary: string;
}

export interface AdminHistorySession {
  id: string;
  title: string;
  updatedAtLabel: string;
  pregnancyWeekLabel: string;
  messages: AdminHistoryMessage[];
}

export interface AdminHistoryUser {
  id: string;
  name: string;
  phoneNumber: string;
  pregnancyWeekLabel: string;
  latestSessionLabel: string;
  sessions: AdminHistorySession[];
}

export interface AdminDashboardData {
  metrics: AdminMetric[];
  managedUsers: AdminManagedUser[];
  recoveryActions: AdminRecoveryAction[];
  ragDocuments: AdminRagDocument[];
  workflowRules: AdminWorkflowRule[];
  historyUsers: AdminHistoryUser[];
}
