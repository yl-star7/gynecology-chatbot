import type {
  AuthenticatedUser,
  ChatMessage,
  ChatSession,
  HomeViewData,
  LinkTargetContent,
  OnboardingProfileInput,
  RecentChatSummary,
} from "@gynecology-chatbot/app-core";

type MobileFetch = typeof fetch;

interface MobileApiClientOptions {
  fetchImpl?: MobileFetch;
  getApiBaseUrl?: () => string;
  getUserId?: () => string;
}

export interface MobileApiClient {
  signInWithPhonePassword(input: { phoneNumber: string; password: string }): Promise<{ user: AuthenticatedUser }>;
  verifyPhone(input: { phoneNumber: string; verificationCode: string }): Promise<{ verificationToken: string }>;
  setPassword(input: { verificationToken: string; password: string }): Promise<{ user: AuthenticatedUser }>;
  requestPasswordReset(input: { phoneNumber: string }): Promise<{ ok: true }>;
  completeOnboarding(input: { userId: string } & OnboardingProfileInput): Promise<{ user: AuthenticatedUser }>;
  fetchHome(month?: string): Promise<{ home: HomeViewData }>;
  fetchSessions(): Promise<{ sessions: RecentChatSummary[] }>;
  fetchSession(sessionId: string): Promise<{ session: ChatSession }>;
  fetchLinkTarget(target: string, entityId?: string): Promise<{ content: LinkTargetContent }>;
  sendChatMessage(input: {
    sessionId: string;
    text: string;
    pregnancyWeek?: number;
    imageDataUris: string[];
  }): Promise<{ assistantMessage: ChatMessage }>;
}

function getEnvApiBaseUrl() {
  const url = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!url) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL is not configured");
  }

  return url.replace(/\/$/, "");
}

function getEnvUserId() {
  const userId = process.env.EXPO_PUBLIC_DEV_USER_ID;
  if (!userId) {
    throw new Error("EXPO_PUBLIC_DEV_USER_ID is not configured");
  }

  return userId;
}

async function parseJson<T>(response: Response) {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? `Request failed: ${response.status}`);
  }

  return payload;
}

export function createMobileApiClient(options: MobileApiClientOptions = {}): MobileApiClient {
  const fetchImpl = options.fetchImpl ?? fetch;
  const getApiBaseUrl = options.getApiBaseUrl ?? getEnvApiBaseUrl;
  const getUserId = options.getUserId ?? getEnvUserId;

  return {
    async signInWithPhonePassword(input) {
      const response = await fetchImpl(`${getApiBaseUrl()}/api/mobile/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      return parseJson<{ user: AuthenticatedUser }>(response);
    },

    async verifyPhone(input) {
      const response = await fetchImpl(`${getApiBaseUrl()}/api/mobile/auth/verify-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      return parseJson<{ verificationToken: string }>(response);
    },

    async setPassword(input) {
      const response = await fetchImpl(`${getApiBaseUrl()}/api/mobile/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      return parseJson<{ user: AuthenticatedUser }>(response);
    },

    async requestPasswordReset(input) {
      const response = await fetchImpl(`${getApiBaseUrl()}/api/mobile/auth/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      return parseJson<{ ok: true }>(response);
    },

    async completeOnboarding(input) {
      const response = await fetchImpl(`${getApiBaseUrl()}/api/mobile/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      return parseJson<{ user: AuthenticatedUser }>(response);
    },

    async fetchHome(month) {
      const searchParams = new URLSearchParams({ userId: getUserId(), ...(month ? { month } : {}) });
      const response = await fetchImpl(`${getApiBaseUrl()}/api/mobile/home?${searchParams.toString()}`);
      return parseJson<{ home: HomeViewData }>(response);
    },

    async fetchSessions() {
      const response = await fetchImpl(`${getApiBaseUrl()}/api/mobile/sessions?userId=${encodeURIComponent(getUserId())}`);
      return parseJson<{ sessions: RecentChatSummary[] }>(response);
    },

    async fetchSession(sessionId) {
      const response = await fetchImpl(
        `${getApiBaseUrl()}/api/mobile/sessions/${encodeURIComponent(sessionId)}?userId=${encodeURIComponent(getUserId())}`,
      );
      return parseJson<{ session: ChatSession }>(response);
    },

    async fetchLinkTarget(target, entityId) {
      const searchParams = new URLSearchParams({ target, ...(entityId ? { entityId } : {}) });
      const response = await fetchImpl(`${getApiBaseUrl()}/api/mobile/link?${searchParams.toString()}`);
      return parseJson<{ content: LinkTargetContent }>(response);
    },

    async sendChatMessage(input) {
      const response = await fetchImpl(`${getApiBaseUrl()}/api/mobile/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: getUserId(),
          sessionId: input.sessionId,
          text: input.text,
          pregnancyWeek: input.pregnancyWeek,
          imageDataUris: input.imageDataUris,
        }),
      });

      return parseJson<{ assistantMessage: ChatMessage }>(response);
    },
  };
}

const defaultClient = createMobileApiClient();

export function signInWithPhonePassword(input: { phoneNumber: string; password: string }) {
  return defaultClient.signInWithPhonePassword(input);
}

export function verifyPhone(input: { phoneNumber: string; verificationCode: string }) {
  return defaultClient.verifyPhone(input);
}

export function setPassword(input: { verificationToken: string; password: string }) {
  return defaultClient.setPassword(input);
}

export function requestPasswordReset(input: { phoneNumber: string }) {
  return defaultClient.requestPasswordReset(input);
}

export function completeOnboarding(input: { userId: string } & OnboardingProfileInput) {
  return defaultClient.completeOnboarding(input);
}

export function fetchHome(month?: string) {
  return defaultClient.fetchHome(month);
}

export function fetchSessions() {
  return defaultClient.fetchSessions();
}

export function fetchSession(sessionId: string) {
  return defaultClient.fetchSession(sessionId);
}

export function fetchLinkTarget(target: string, entityId?: string) {
  return defaultClient.fetchLinkTarget(target, entityId);
}

export function sendChatMessage(input: {
  sessionId: string;
  text: string;
  pregnancyWeek?: number;
  imageDataUris: string[];
}) {
  return defaultClient.sendChatMessage(input);
}
