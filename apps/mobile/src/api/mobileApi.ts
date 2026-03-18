import type {
  AuthenticatedUser,
  ChatMessage,
  ChatSession,
  HomeViewData,
  LinkTargetContent,
  MobileContentListItem,
  MobileProfileViewData,
  OnboardingProfileInput,
  RecentChatSummary,
} from "@gynecology-chatbot/app-core";

type MobileFetch = typeof fetch;

let currentMobileSessionToken: string | null = null;

interface MobileApiClientOptions {
  fetchImpl?: MobileFetch;
  getApiBaseUrl?: () => string;
  getUserId?: () => string;
}

export interface MobileApiClient {
  requestPhoneVerification(input: { phoneNumber: string }): Promise<{ ok: true }>;
  signInWithPhoneVerification(input: {
    phoneNumber: string;
    verificationCode: string;
  }): Promise<{ user: AuthenticatedUser; sessionToken?: string }>;
  completeOnboarding(input: { userId: string } & OnboardingProfileInput): Promise<{ user: AuthenticatedUser }>;
  fetchHome(month?: string): Promise<{ home: HomeViewData }>;
  fetchMobileProfile(): Promise<{ profile: MobileProfileViewData }>;
  fetchSessions(): Promise<{ sessions: RecentChatSummary[] }>;
  fetchSession(sessionId: string): Promise<{ session: ChatSession }>;
  fetchContentItems(section: "knowledge" | "notebook"): Promise<{ items: MobileContentListItem[] }>;
  fetchLinkTarget(target: string, entityId?: string): Promise<{ content: LinkTargetContent }>;
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

function buildMobileSessionHeaders() {
  return currentMobileSessionToken
    ? {
        Authorization: `Bearer ${currentMobileSessionToken}`,
      }
    : ({} as Record<string, string>);
}

export function readCurrentMobileSessionToken() {
  return currentMobileSessionToken;
}

export function storeCurrentMobileSessionToken(sessionToken: string | null) {
  currentMobileSessionToken = sessionToken;
}

export function createMobileApiClient(options: MobileApiClientOptions = {}): MobileApiClient {
  const fetchImpl = options.fetchImpl ?? fetch;
  const getApiBaseUrl = options.getApiBaseUrl ?? getEnvApiBaseUrl;
  const getUserId = options.getUserId ?? getEnvUserId;

  return {
    async requestPhoneVerification(input) {
      const response = await fetchImpl(`${getApiBaseUrl()}/api/mobile/auth/start-phone-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      return parseJson<{ ok: true }>(response);
    },

    async signInWithPhoneVerification(input) {
      const response = await fetchImpl(`${getApiBaseUrl()}/api/mobile/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const payload = await parseJson<{ user: AuthenticatedUser; sessionToken?: string }>(response);
      if (payload.sessionToken) {
        storeCurrentMobileSessionToken(payload.sessionToken);
      }
      return payload;
    },

    async completeOnboarding(input) {
      const response = await fetchImpl(`${getApiBaseUrl()}/api/mobile/onboarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildMobileSessionHeaders(),
        },
        body: JSON.stringify(input),
      });

      return parseJson<{ user: AuthenticatedUser }>(response);
    },

    async fetchHome(month) {
      const searchParams = new URLSearchParams({ userId: getUserId(), ...(month ? { month } : {}) });
      const response = await fetchImpl(`${getApiBaseUrl()}/api/mobile/home?${searchParams.toString()}`, {
        headers: buildMobileSessionHeaders(),
      });
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

    async fetchSessions() {
      const response = await fetchImpl(`${getApiBaseUrl()}/api/mobile/sessions?userId=${encodeURIComponent(getUserId())}`, {
        headers: buildMobileSessionHeaders(),
      });
      return parseJson<{ sessions: RecentChatSummary[] }>(response);
    },

    async fetchSession(sessionId) {
      const response = await fetchImpl(
        `${getApiBaseUrl()}/api/mobile/sessions/${encodeURIComponent(sessionId)}?userId=${encodeURIComponent(getUserId())}`,
        {
          headers: buildMobileSessionHeaders(),
        },
      );
      return parseJson<{ session: ChatSession }>(response);
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

    async fetchLinkTarget(target, entityId) {
      const searchParams = new URLSearchParams({ target, ...(entityId ? { entityId } : {}) });
      const response = await fetchImpl(`${getApiBaseUrl()}/api/mobile/link?${searchParams.toString()}`, {
        headers: buildMobileSessionHeaders(),
      });
      return parseJson<{ content: LinkTargetContent }>(response);
    },

    async updateMobileProfile(input) {
      const response = await fetchImpl(`${getApiBaseUrl()}/api/mobile/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...buildMobileSessionHeaders(),
        },
        body: JSON.stringify(input),
      });

      return parseJson<{ user: AuthenticatedUser }>(response);
    },

    async sendChatMessage(input) {
      const response = await fetchImpl(`${getApiBaseUrl()}/api/mobile/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildMobileSessionHeaders(),
        },
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

export function requestPhoneVerification(input: { phoneNumber: string }) {
  return defaultClient.requestPhoneVerification(input);
}

export function signInWithPhoneVerification(input: {
  phoneNumber: string;
  verificationCode: string;
}) {
  return defaultClient.signInWithPhoneVerification(input);
}

export function completeOnboarding(input: { userId: string } & OnboardingProfileInput) {
  return defaultClient.completeOnboarding(input);
}

export function fetchHome(month?: string) {
  return defaultClient.fetchHome(month);
}

export function fetchMobileProfile() {
  return defaultClient.fetchMobileProfile();
}

export function fetchSessions() {
  return defaultClient.fetchSessions();
}

export function fetchSession(sessionId: string) {
  return defaultClient.fetchSession(sessionId);
}

export function fetchContentItems(section: "knowledge" | "notebook") {
  return defaultClient.fetchContentItems(section);
}

export function fetchLinkTarget(target: string, entityId?: string) {
  return defaultClient.fetchLinkTarget(target, entityId);
}

export function updateMobileProfile(input: {
  userId: string;
  displayName: string;
  dueDate?: string | null;
  tonePreference: string;
  babyNickname?: string | null;
  hospitalName?: string | null;
  notificationTime?: string | null;
  themeKey?: MobileProfileViewData["themeKey"];
}) {
  return defaultClient.updateMobileProfile(input);
}

export function sendChatMessage(input: {
  sessionId: string;
  text: string;
  pregnancyWeek?: number;
  imageDataUris: string[];
}) {
  return defaultClient.sendChatMessage(input);
}
