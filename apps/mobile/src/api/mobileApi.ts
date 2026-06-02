import type {
  AuthenticatedUser,
  ChatMessage,
  ChatSession,
  EmotionTone,
  HomeViewData,
  LinkTargetContent,
  MobileContentListItem,
  MobilePregnancyWeekSummary,
  MobileProfileViewData,
  OnboardingProfileInput,
  RecentChatSummary,
  RecordDayView,
  TodayViewData,
} from "@gynecology-chatbot/app-core";
import {
  readNativeSessionToken,
  readNativeUserId,
} from "../core/nativeSessionStorage.ts";
import { sanitizeChatMessage, sanitizeChatSession } from "./mobileApi.model.ts";

export class SessionExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionExpiredError";
  }
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

type MobileFetch = typeof fetch;
type NurseImageTone =
  | "neutral"
  | "calm"
  | "joyful"
  | "anxious"
  | "tired"
  | "sad";
type CharacterImagesManifest = {
  version: string;
  images: Record<NurseImageTone, string>;
};
type MobileSessionExpiredHandler = () => void | Promise<void>;

let currentMobileSessionToken: string | null = null;
let currentMobileUserId: string | null = null;
let mobileSessionExpiredHandler: MobileSessionExpiredHandler | null = null;
let isNotifyingSessionExpired = false;

const SESSION_EXPIRED_MESSAGE = "세션이 만료되었어요. 다시 로그인해 주세요.";

interface MobileApiClientOptions {
  fetchImpl?: MobileFetch;
  getApiBaseUrl?: () => string;
  getUserId?: () => string;
}

export interface MobileApiClient {
  requestPhoneVerification(input: {
    phoneNumber: string;
  }): Promise<{ ok: true }>;
  signInWithPhoneVerification(input: {
    phoneNumber: string;
    verificationCode: string;
  }): Promise<{ user: AuthenticatedUser; sessionToken?: string }>;
  fetchCurrentMobileSession(): Promise<{ user: AuthenticatedUser }>;
  completeOnboarding(
    input: { userId: string } & OnboardingProfileInput,
  ): Promise<{ user: AuthenticatedUser }>;
  fetchHome(month?: string): Promise<{ home: HomeViewData }>;
  fetchMobileProfile(): Promise<{ profile: MobileProfileViewData }>;
  fetchMobileBranding(): Promise<{
    mascotImageUrl: string | null;
    mascotAltText: string | null;
    surveyFormUrl: string | null;
    externalSurveys?: Array<{
      id: string;
      label: string;
      url: string | null;
      visible: boolean;
    }>;
    characterImages?: CharacterImagesManifest;
  }>;
  fetchTodayView(): Promise<{ today: TodayViewData }>;
  updateTodayChecklistItem(input: {
    checklistId: string;
    completed: boolean;
  }): Promise<{ ok: true }>;
  markTodayInfoViewed(): Promise<{ ok: true }>;
  fetchSessions(): Promise<{ sessions: RecentChatSummary[] }>;
  fetchInitialConversationMessage(): Promise<{ message: ChatMessage }>;
  fetchRecordDay(isoDate: string): Promise<{ recordDay: RecordDayView }>;
  fetchSession(sessionId: string): Promise<{ session: ChatSession }>;
  fetchContentItems(
    section: "knowledge" | "notebook",
  ): Promise<{ items: MobileContentListItem[] }>;
  fetchPregnancyWeeks(input?: {
    week?: number | null;
  }): Promise<{ weeks: MobilePregnancyWeekSummary[] }>;
  fetchLinkTarget(
    target: string,
    entityId?: string,
  ): Promise<{ content: LinkTargetContent }>;
  updateMobileProfile(input: {
    userId: string;
    displayName: string;
    dueDate?: string | null;
    tonePreference: string;
    babyNickname?: string | null;
    hospitalName?: string | null;
    notificationTime?: string | null;
    themeKey?: MobileProfileViewData["themeKey"];
  }): Promise<{ user: AuthenticatedUser }>;
  submitProfileSurveyAnswer(input: {
    userId: string;
    questionId: string;
    answer: string;
  }): Promise<{ ok: true }>;
  sendChatMessage(input: {
    sessionId: string;
    text: string;
    pregnancyWeek?: number;
    selectedQuestionId?: string;
    selectedMoodTone?: EmotionTone;
    imageDataUris: string[];
  }): Promise<{
    assistantMessage: ChatMessage;
    assistantMessages?: ChatMessage[];
  }>;
  summarizeChatSession(
    sessionId: string,
  ): Promise<{ summarized: boolean; summary?: string; reason?: string }>;
}

function getEnvApiBaseUrl() {
  const url =
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    "https://agaya-api-yvdnhntt7a-du.a.run.app";

  return url.replace(/\/$/, "");
}

function getEnvUserId() {
  if (currentMobileUserId) return currentMobileUserId;
  throw new Error(
    "User ID is not available. Ensure session is restored before making API calls.",
  );
}

export function setMobileSessionExpiredHandler(
  handler: MobileSessionExpiredHandler | null,
) {
  mobileSessionExpiredHandler = handler;
}

function notifyMobileSessionExpired() {
  if (!mobileSessionExpiredHandler || isNotifyingSessionExpired) {
    return;
  }

  isNotifyingSessionExpired = true;
  void Promise.resolve(mobileSessionExpiredHandler()).finally(() => {
    isNotifyingSessionExpired = false;
  });
}

function createSessionExpiredError() {
  notifyMobileSessionExpired();
  return new SessionExpiredError(SESSION_EXPIRED_MESSAGE);
}

async function parseJson<T>(response: Response) {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    if (response.status === 401) {
      throw createSessionExpiredError();
    }
    if (response.status === 429) {
      throw new RateLimitError("잠시 후 다시 시도해 주세요.");
    }
    throw new Error(payload.error ?? `Request failed: ${response.status}`);
  }

  return payload;
}

function buildMobileSessionHeaders() {
  return currentMobileSessionToken
    ? {
        Authorization: `Bearer ${currentMobileSessionToken}`,
      }
    : ({} as Record<string, string>);
}

async function ensureMobileSessionState() {
  if (!currentMobileSessionToken) {
    const nativeToken = await readNativeSessionToken();
    if (nativeToken) {
      currentMobileSessionToken = nativeToken;
    }
  }

  if (!currentMobileUserId) {
    const nativeUserId = await readNativeUserId();
    if (nativeUserId) {
      currentMobileUserId = nativeUserId;
    }
  }
}

export function readCurrentMobileSessionToken() {
  return currentMobileSessionToken;
}

export function storeCurrentMobileSessionToken(sessionToken: string | null) {
  currentMobileSessionToken = sessionToken;
}

export function readCurrentMobileUserId() {
  return currentMobileUserId;
}

export function storeCurrentMobileUserId(userId: string | null) {
  currentMobileUserId = userId;
}

export function createMobileApiClient(
  options: MobileApiClientOptions = {},
): MobileApiClient {
  const fetchImpl = options.fetchImpl ?? fetch;
  const getApiBaseUrl = options.getApiBaseUrl ?? getEnvApiBaseUrl;
  const getUserId = options.getUserId ?? getEnvUserId;

  return {
    async requestPhoneVerification(input) {
      const response = await fetchImpl(
        `${getApiBaseUrl()}/api/mobile/auth/start-phone-verification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        },
      );

      return parseJson<{ ok: true }>(response);
    },

    async signInWithPhoneVerification(input) {
      const response = await fetchImpl(
        `${getApiBaseUrl()}/api/mobile/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        },
      );

      const payload = await parseJson<{
        user: AuthenticatedUser;
        sessionToken?: string;
      }>(response);
      if (payload.sessionToken) {
        storeCurrentMobileSessionToken(payload.sessionToken);
      }
      return payload;
    },

    async fetchCurrentMobileSession() {
      await ensureMobileSessionState();
      const response = await fetchImpl(
        `${getApiBaseUrl()}/api/mobile/auth/session`,
        {
          method: "GET",
          headers: buildMobileSessionHeaders(),
        },
      );

      return parseJson<{ user: AuthenticatedUser }>(response);
    },

    async completeOnboarding(input) {
      const response = await fetchImpl(
        `${getApiBaseUrl()}/api/mobile/onboarding`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...buildMobileSessionHeaders(),
          },
          body: JSON.stringify(input),
        },
      );

      return parseJson<{ user: AuthenticatedUser }>(response);
    },

    async fetchHome(month) {
      const searchParams = new URLSearchParams({
        userId: getUserId(),
        ...(month ? { month } : {}),
      });
      const response = await fetchImpl(
        `${getApiBaseUrl()}/api/mobile/home?${searchParams.toString()}`,
        {
          headers: buildMobileSessionHeaders(),
        },
      );
      return parseJson<{ home: HomeViewData }>(response);
    },

    async fetchMobileProfile() {
      const response = await fetchImpl(
        `${getApiBaseUrl()}/api/mobile/profile?userId=${encodeURIComponent(getUserId())}`,
        {
          headers: buildMobileSessionHeaders(),
        },
      );
      return parseJson<{ profile: MobileProfileViewData }>(response);
    },

    async fetchMobileBranding() {
      const response = await fetchImpl(
        `${getApiBaseUrl()}/api/mobile/branding`,
        {
          headers: buildMobileSessionHeaders(),
        },
      );
      return parseJson<{
        mascotImageUrl: string | null;
        mascotAltText: string | null;
        surveyFormUrl: string | null;
        externalSurveys?: Array<{
          id: string;
          label: string;
          url: string | null;
          visible: boolean;
        }>;
        characterImages?: CharacterImagesManifest;
      }>(response);
    },

    async submitProfileSurveyAnswer(input) {
      const response = await fetchImpl(
        `${getApiBaseUrl()}/api/mobile/profile/surveys`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...buildMobileSessionHeaders(),
          },
          body: JSON.stringify(input),
        },
      );

      return parseJson<{ ok: true }>(response);
    },

    async fetchTodayView() {
      const response = await fetchImpl(
        `${getApiBaseUrl()}/api/mobile/today?userId=${encodeURIComponent(getUserId())}`,
        {
          headers: buildMobileSessionHeaders(),
        },
      );
      return parseJson<{ today: TodayViewData }>(response);
    },

    async updateTodayChecklistItem(input) {
      const response = await fetchImpl(`${getApiBaseUrl()}/api/mobile/today`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...buildMobileSessionHeaders(),
        },
        body: JSON.stringify({
          userId: getUserId(),
          checklistId: input.checklistId,
          completed: input.completed,
        }),
      });

      return parseJson<{ ok: true }>(response);
    },

    async markTodayInfoViewed() {
      const response = await fetchImpl(`${getApiBaseUrl()}/api/mobile/today`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...buildMobileSessionHeaders(),
        },
        body: JSON.stringify({
          userId: getUserId(),
          action: "view_info",
        }),
      });

      return parseJson<{ ok: true }>(response);
    },

    async fetchSessions() {
      const response = await fetchImpl(
        `${getApiBaseUrl()}/api/mobile/sessions?userId=${encodeURIComponent(getUserId())}`,
        {
          headers: buildMobileSessionHeaders(),
        },
      );
      return parseJson<{ sessions: RecentChatSummary[] }>(response);
    },

    async fetchInitialConversationMessage() {
      await ensureMobileSessionState();
      const sessionHeaders = buildMobileSessionHeaders();
      if (!sessionHeaders.Authorization) {
        throw createSessionExpiredError();
      }

      const response = await fetchImpl(
        `${getApiBaseUrl()}/api/mobile/chat/initial-workflow`,
        {
          headers: sessionHeaders,
        },
      );
      const payload = await parseJson<{ message: ChatMessage }>(response);
      return { message: sanitizeChatMessage(payload.message) };
    },

    async fetchRecordDay(isoDate) {
      const response = await fetchImpl(
        `${getApiBaseUrl()}/api/mobile/records?userId=${encodeURIComponent(getUserId())}&date=${encodeURIComponent(isoDate)}`,
        {
          headers: buildMobileSessionHeaders(),
        },
      );
      return parseJson<{ recordDay: RecordDayView }>(response);
    },

    async fetchSession(sessionId) {
      const response = await fetchImpl(
        `${getApiBaseUrl()}/api/mobile/sessions/${encodeURIComponent(sessionId)}?userId=${encodeURIComponent(getUserId())}`,
        {
          headers: buildMobileSessionHeaders(),
        },
      );
      const payload = await parseJson<{ session: ChatSession }>(response);
      return { session: sanitizeChatSession(payload.session) };
    },

    async fetchContentItems(section) {
      const response = await fetchImpl(
        `${getApiBaseUrl()}/api/mobile/content-items?section=${encodeURIComponent(section)}`,
        {
          headers: buildMobileSessionHeaders(),
        },
      );
      return parseJson<{ items: MobileContentListItem[] }>(response);
    },

    async fetchPregnancyWeeks(input) {
      const searchParams = new URLSearchParams();
      if (typeof input?.week === "number") {
        searchParams.set("week", String(input.week));
      }
      const qs = searchParams.toString();
      const response = await fetchImpl(
        `${getApiBaseUrl()}/api/mobile/weeks${qs ? `?${qs}` : ""}`,
        {
          headers: buildMobileSessionHeaders(),
        },
      );
      return parseJson<{ weeks: MobilePregnancyWeekSummary[] }>(response);
    },

    async fetchLinkTarget(target, entityId) {
      const searchParams = new URLSearchParams({
        target,
        ...(entityId ? { entityId } : {}),
      });
      const response = await fetchImpl(
        `${getApiBaseUrl()}/api/mobile/link?${searchParams.toString()}`,
        {
          headers: buildMobileSessionHeaders(),
        },
      );
      return parseJson<{ content: LinkTargetContent }>(response);
    },

    async updateMobileProfile(input) {
      const response = await fetchImpl(
        `${getApiBaseUrl()}/api/mobile/profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...buildMobileSessionHeaders(),
          },
          body: JSON.stringify(input),
        },
      );

      return parseJson<{ user: AuthenticatedUser }>(response);
    },

    async sendChatMessage(input) {
      await ensureMobileSessionState();
      const sessionHeaders = buildMobileSessionHeaders();
      if (!sessionHeaders.Authorization) {
        throw createSessionExpiredError();
      }

      let resolvedUserId: string;
      try {
        resolvedUserId = getUserId();
      } catch {
        throw createSessionExpiredError();
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60_000);
      try {
        const response = await fetchImpl(`${getApiBaseUrl()}/api/mobile/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...sessionHeaders,
          },
          body: JSON.stringify({
            userId: resolvedUserId,
            sessionId: input.sessionId,
            text: input.text,
            pregnancyWeek: input.pregnancyWeek,
            selectedQuestionId: input.selectedQuestionId,
            selectedMoodTone: input.selectedMoodTone,
            imageDataUris: input.imageDataUris,
          }),
          signal: controller.signal,
        });
        const payload = await parseJson<{
          assistantMessage: ChatMessage;
          assistantMessages?: ChatMessage[];
        }>(response);
        return {
          assistantMessage: sanitizeChatMessage(payload.assistantMessage),
          assistantMessages: payload.assistantMessages?.map(sanitizeChatMessage),
        };
      } finally {
        clearTimeout(timeoutId);
      }
    },

    async summarizeChatSession(sessionId: string) {
      const sessionHeaders = buildMobileSessionHeaders();
      if (!sessionHeaders.Authorization) {
        throw createSessionExpiredError();
      }
      const response = await fetchImpl(
        `${getApiBaseUrl()}/api/mobile/sessions/${sessionId}/summarize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...sessionHeaders,
          },
          body: "{}",
        },
      );
      return parseJson<{
        summarized: boolean;
        summary?: string;
        reason?: string;
      }>(response);
    },
  };
}

export async function fetchCurrentMobileSession() {
  const apiBaseUrl = getEnvApiBaseUrl();
  const headers: Record<string, string> = {};
  const token = readCurrentMobileSessionToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(`${apiBaseUrl}/api/mobile/auth/session`, {
      method: "GET",
      headers,
      signal: controller.signal,
    });
    return parseJson<{ user: AuthenticatedUser }>(response);
  } finally {
    clearTimeout(timeoutId);
  }
}
