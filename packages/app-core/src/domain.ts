import type { MobileThemeKey } from "./theme";

export type EmotionTone = "calm" | "joyful" | "anxious" | "tired" | "sad";

export interface CalendarDay {
  isoDate: string;
  dayLabel: string;
  hasChat: boolean;
  hasInfo: boolean;
  emotionTone: EmotionTone | null;
  summary?: string;
}

export interface HomeShortcutCard {
  id: string;
  title: string;
  description: string;
  href: string;
}

export type HomeCopySlot = "hero_bubble" | "daily_note" | "encouragement_quote";

export type HomeCopyStatus = "draft" | "published" | "archived";

export interface HomeCopyItem {
  id: string;
  slot: HomeCopySlot;
  variant: string | null;
  title: string;
  body: string;
  status: HomeCopyStatus;
  displayOrder: number;
  updatedAt: string;
}

export interface HomeCopyItemInput {
  slot: HomeCopySlot;
  variant?: string | null;
  title: string;
  body: string;
  status: HomeCopyStatus;
  displayOrder?: number | null;
}

export interface HomeViewData {
  userName: string;
  pregnancyDayCount: number;
  pregnancyWeekLabel: string;
  currentMonthLabel: string;
  calendarDays: CalendarDay[];
  notebookCard: HomeShortcutCard;
  knowledgeCard: HomeShortcutCard;
  homeCopyItems?: HomeCopyItem[];
}

export interface RecentChatSummary {
  id: string;
  title: string;
  preview: string;
  summary?: string | null;
  updatedAtLabel: string;
  updatedAtIso?: string | null;
  isReadOnly?: boolean;
}

export interface RecordDayItem {
  id: string;
  title: string;
  summary?: string;
  entryType: string;
  linkedSessionId?: string | null;
}

export interface DailyQuestionSummary {
  id: string;
  question: string;
  answerSummary: string | null;
}

export interface RecordDayView {
  isoDate: string;
  dateLabel: string;
  infoViewed: boolean;
  emotionTone: EmotionTone | null;
  checklistItems: TodayChecklistItem[];
  conversationSummary?: string;
  dailyQuestion?: {
    question: string;
    answer: string | null;
    aiSummary: string | null;
  } | null;
  dailyQuestions?: DailyQuestionSummary[];
  records: RecordDayItem[];
  relatedSessions: RecentChatSummary[];
}

export interface TodayChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface TodayViewData {
  babyBody: string;
  momBody: string;
  infoViewed: boolean;
  checklistItems: TodayChecklistItem[];
}

export interface SurveyChoice {
  id: string;
  label: string;
}

export type SurveyQuestionType =
  | "text"
  | "single_choice"
  | "multi_choice"
  | "yes_no"
  | "number";

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
  tag?: string;
  contentId?: string;
  contentCode?: string;
}

export interface QuickReplyChoice {
  id: string;
  label: string;
  message: string;
  moodTone?: EmotionTone;
}

export interface QuickRepliesPart {
  type: "quickReplies";
  id: string;
  title?: string;
  choices: QuickReplyChoice[];
  tag?: string;
  contentId?: string;
  contentCode?: string;
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
  weekNumber?: number;
}

export type ChatPart =
  | TextPart
  | QuickRepliesPart
  | SurveyPart
  | CarouselPart
  | ImagePart
  | DeepLinkPart;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  createdAtLabel: string;
  characterTone?: EmotionTone | null;
  parts: ChatPart[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastMessageAtIso?: string | null;
}

export interface ChatComposerInput {
  sessionId: string;
  text: string;
  pregnancyWeek?: number;
  selectedQuestionId?: string;
  selectedMoodTone?: EmotionTone;
}

export interface LinkTargetContent {
  title: string;
  section: string;
  body: string;
  ctaLabel?: string;
}

export interface MobileContentListItem {
  id: string;
  slug: string;
  section: "knowledge" | "notebook";
  title: string;
  preview: string;
}

export interface MobileWeeklyEncyclopediaSection {
  title: string | null;
  summary: string | null;
  body: string | null;
  items: unknown[];
}

export interface MobilePregnancyWeekSummary {
  weekNumber: number;
  linkEntityId?: string | null;
  title: string;
  babySizeLabel: string | null;
  babySummary: string | null;
  motherSummary: string | null;
  lifeGuide?: MobileWeeklyEncyclopediaSection | null;
  caution?: MobileWeeklyEncyclopediaSection | null;
  reflectionQuestion?: MobileWeeklyEncyclopediaSection | null;
  faq?: {
    title: string | null;
    items: unknown[];
  } | null;
}

export type UserAccountStatus =
  | "active"
  | "paused"
  | "deleted"
  | "pending_recovery"
  | "pending_approval";

export interface AuthenticatedUser {
  id: string;
  phoneNumber: string;
  displayName: string;
  accountStatus: UserAccountStatus;
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
  themeKey?: MobileThemeKey | null;
  pendingSurveys?: ProfileSurveyQuestion[];
}

export interface ProfileSurveyQuestion {
  id: string;
  code: string;
  questionText: string;
  questionType: SurveyQuestionType;
  helpText?: string | null;
  choices: SurveyChoice[];
  answered: boolean;
}

export interface OnboardingProfileInput {
  pregnancyWeekOrDueDate: string;
  tonePreference: string;
  babyNickname?: string | null;
  themeKey?: MobileThemeKey | null;
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
  accountStatus: UserAccountStatus;
  latestIssue: string;
}

export interface AdminRecoveryAction {
  id: string;
  userName: string;
  action: string;
  requestedAt: string;
  status: "pending" | "completed";
}

export interface AdminAllowedPhoneNumber {
  id: string;
  phoneNumber: string;
  displayName: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRagDocument {
  id: string;
  title: string;
  pregnancyWeekLabel: string;
  category: string;
  chunkCount: number;
  updatedAt: string;
  status: "ready" | "draft";
  sourceFileId?: string | null;
  sourceFilename?: string | null;
}

export interface AdminRagDocumentDetail extends AdminRagDocument {
  pregnancyWeek: number | null;
  content: string;
  imageUrl: string | null;
}

export interface AdminRagDocumentInput {
  title: string;
  pregnancyWeek: number | null;
  category: string;
  content: string;
  imageUrl?: string | null;
}

export interface AdminKnowledgeItem {
  id: string;
  slug: string;
  section: "knowledge" | "notebook";
  title: string;
  body: string;
  imageUrl: string | null;
  status: "draft" | "published" | "archived";
  updatedAt: string;
}

export interface AdminKnowledgeItemInput {
  slug: string;
  section: "knowledge" | "notebook";
  title: string;
  body: string;
  imageUrl?: string | null;
  status: AdminKnowledgeItem["status"];
}

export interface AdminWorkflowBlock {
  id: string;
  type: string;
  title?: string;
  config?: Record<string, unknown>;
}

export interface AdminWorkflowRule {
  id: string;
  name: string;
  trigger: string;
  retrievalScope: string;
  modelName: string;
  status: "active" | "review";
  blocks?: AdminWorkflowBlock[];
  source?: "sql" | "schift" | "gcs-yaml";
  workflowKind?: "router" | "subworkflow" | "monolith" | "managed";
  storagePath?: string | null;
  gcsBucket?: string | null;
  gcsObject?: string | null;
  sqlSlug?: string | null;
}

export interface AdminWorkflowRuleInput {
  name: string;
  trigger: string;
  retrievalScope: string;
  modelName: string;
  status: AdminWorkflowRule["status"];
  workflowKind?: AdminWorkflowRule["workflowKind"];
  storagePath?: string | null;
  gcsBucket?: string | null;
  gcsObject?: string | null;
}

export interface AdminHistoryMessageRagSource {
  fileId: string;
  filename: string;
  similarity: number;
}

export interface AdminHistoryMessage {
  id: string;
  role: "user" | "assistant";
  createdAtLabel: string;
  summary: string;
  ragSources?: AdminHistoryMessageRagSource[];
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
  userActions: AdminUserAction[];
}

export type UserActionType =
  | "login_succeeded"
  | "phone_verification_started"
  | "phone_verified"
  | "onboarding_completed"
  | "profile_updated"
  | "chat_message_sent"
  | "account_paused"
  | "account_resumed"
  | "account_approved";

export interface AdminUserAction {
  id: string;
  userId: string;
  userName: string;
  actionType: UserActionType;
  actionLabel: string;
  detail: string;
  occurredAtLabel: string;
  sessionId: string | null;
  sessionTitle: string | null;
}

export interface AdminWeekSection {
  id: string;
  dayNumber: number | null;
  sectionKey: string;
  title: string;
  body: string;
  displayOrder: number;
  isRequired: boolean;
  isActive: boolean;
}

export interface AdminWeekAsset {
  id: string;
  dayNumber: number | null;
  assetType: string;
  storagePath: string;
  altText: string | null;
  styleKey: string | null;
  displayOrder: number;
  isRequired: boolean;
  isActive: boolean;
}

export interface AdminWeekSectionInput {
  id?: string | null;
  dayNumber: number | null;
  sectionKey: string;
  title: string;
  body: string;
  displayOrder: number;
  isRequired: boolean;
  isActive: boolean;
}

export interface AdminWeekAssetInput {
  id?: string | null;
  dayNumber: number | null;
  assetType: string;
  storagePath: string;
  altText: string | null;
  styleKey: string | null;
  displayOrder: number;
  isRequired: boolean;
  isActive: boolean;
}

export interface AdminWeekDay {
  id: string;
  dayNumber: number;
  title: string;
  babyDevelopmentItems: string[];
  babyMessage: string | null;
  motherChangesItems: string[];
  displayOrder: number;
}

export interface AdminWeekDayInput {
  id?: string | null;
  dayNumber: number;
  title: string;
  babyDevelopmentItems: string[];
  babyMessage: string | null;
  motherChangesItems: string[];
  displayOrder: number;
}

export interface AdminWeekMedia {
  id: string;
  dayNumber: number | null;
  mediaScope: "week" | "day";
  bucketId: string;
  objectPath: string;
  mediaRole: string;
  altText: string | null;
  sourceFileName: string | null;
  displayOrder: number;
}

export interface AdminWeekMediaInput {
  id?: string | null;
  dayNumber: number | null;
  mediaScope: AdminWeekMedia["mediaScope"];
  bucketId: string;
  objectPath: string;
  mediaRole: string;
  altText: string | null;
  sourceFileName: string | null;
  displayOrder: number;
}

export interface AdminWeekSummary {
  id: string;
  weekNumber: number;
  title: string;
  babySizeLabel: string | null;
  babySizeCompareObject: string | null;
  babySummary: string | null;
  motherSummary: string | null;
  heroImagePath: string | null;
  compareImagePath: string | null;
  status: "draft" | "published" | "archived";
  updatedAt: string;
}

export interface AdminWeekDetail extends AdminWeekSummary {
  babySummary: string;
  motherSummary: string;
  days: AdminWeekDay[];
  sections: AdminWeekSection[];
  assets: AdminWeekAsset[];
  media: AdminWeekMedia[];
}

export interface AdminWeekUpdateInput {
  title: string;
  babySizeLabel: string | null;
  babySizeCompareObject: string | null;
  babySummary: string;
  motherSummary: string;
  heroImagePath: string | null;
  compareImagePath: string | null;
  status: AdminWeekSummary["status"];
  days: AdminWeekDayInput[];
  sections: AdminWeekSectionInput[];
  assets: AdminWeekAssetInput[];
  media: AdminWeekMediaInput[];
}
