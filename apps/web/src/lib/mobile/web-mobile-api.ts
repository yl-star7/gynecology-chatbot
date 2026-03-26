"use client";

import type {
  AuthenticatedUser,
  ChatMessage,
  ChatSession,
  HomeViewData,
  LinkTargetContent,
  MobileContentListItem,
  MobileThemeKey,
  MobileProfileViewData,
  RecentChatSummary,
  RecordDayView,
  TodayViewData,
} from "@gynecology-chatbot/app-core";
import {
  clearMobileSession,
  readStoredMobileSessionToken,
} from "./mobile-session";

type ApiErrorPayload = {
  error?: string;
};

export function resolveMobileUserId(explicitUserId?: string | null) {
  if (explicitUserId) {
    return explicitUserId;
  }

  if (typeof window === "undefined") {
    return null;
  }

  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get("userId");
}

export function appendUserIdToPath(
  path: string,
  explicitUserId?: string | null,
) {
  const userId = resolveMobileUserId(explicitUserId);
  if (!userId) {
    return path;
  }

  const [pathname, hash = ""] = path.split("#");
  const [basePath, query = ""] = pathname.split("?");
  const searchParams = new URLSearchParams(query);
  searchParams.set("userId", userId);

  const nextPath = `${basePath}?${searchParams.toString()}`;
  return hash ? `${nextPath}#${hash}` : nextPath;
}

async function parseJson<T>(response: Response) {
  const payload = (await response.json()) as T & ApiErrorPayload;

  if (!response.ok) {
    if (response.status === 401) {
      clearMobileSession();
    }
    throw new Error(payload.error ?? `Request failed: ${response.status}`);
  }

  return payload;
}

function buildMobileSessionHeaders() {
  if (typeof window === "undefined") {
    return {} as Record<string, string>;
  }

  const sessionToken = readStoredMobileSessionToken();
  if (!sessionToken) {
    return {} as Record<string, string>;
  }

  return {
    Authorization: `Bearer ${sessionToken}`,
  } satisfies Record<string, string>;
}

function createSearch(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  return searchParams.toString();
}

export function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export async function fetchHome(userId: string, month?: string) {
  const response = await fetch(
    `/api/mobile/home?${createSearch({ userId, month })}`,
    {
      cache: "no-store",
      headers: buildMobileSessionHeaders(),
    },
  );

  return parseJson<{ home: HomeViewData }>(response);
}

export async function fetchSessions(userId: string) {
  const response = await fetch(
    `/api/mobile/sessions?${createSearch({ userId })}`,
    {
      cache: "no-store",
      headers: buildMobileSessionHeaders(),
    },
  );

  return parseJson<{ sessions: RecentChatSummary[] }>(response);
}

export async function fetchRecordDay(userId: string, isoDate: string) {
  const response = await fetch(
    `/api/mobile/records?${createSearch({ userId, date: isoDate })}`,
    {
      cache: "no-store",
      headers: buildMobileSessionHeaders(),
    },
  );

  return parseJson<{ recordDay: RecordDayView }>(response);
}

export async function fetchMobileProfile(userId: string) {
  const response = await fetch(
    `/api/mobile/profile?${createSearch({ userId })}`,
    {
      cache: "no-store",
      headers: buildMobileSessionHeaders(),
    },
  );

  return parseJson<{ profile: MobileProfileViewData }>(response);
}

export async function fetchTodayView(userId: string) {
  const response = await fetch(
    `/api/mobile/today?${createSearch({ userId })}`,
    {
      cache: "no-store",
      headers: buildMobileSessionHeaders(),
    },
  );

  return parseJson<{ today: TodayViewData }>(response);
}

export async function updateMobileProfile(input: {
  userId: string;
  displayName: string;
  dueDate?: string | null;
  tonePreference: string;
  babyNickname?: string | null;
  hospitalName?: string | null;
  notificationTime?: string | null;
  themeKey?: MobileThemeKey | null;
}) {
  const response = await fetch("/api/mobile/profile", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...buildMobileSessionHeaders(),
    },
    body: JSON.stringify(input),
  });

  return parseJson<{ user: AuthenticatedUser }>(response);
}

export async function submitProfileSurveyAnswer(input: {
  userId: string;
  questionId: string;
  answer: string;
}) {
  const response = await fetch("/api/mobile/profile/surveys", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildMobileSessionHeaders(),
    },
    body: JSON.stringify(input),
  });

  return parseJson<{ ok: true }>(response);
}

export async function fetchSession(userId: string, sessionId: string) {
  const response = await fetch(
    `/api/mobile/sessions/${encodeURIComponent(sessionId)}?${createSearch({ userId })}`,
    {
      cache: "no-store",
      headers: buildMobileSessionHeaders(),
    },
  );

  return parseJson<{ session: ChatSession }>(response);
}

export async function fetchContentItems(
  section: "knowledge" | "notebook",
) {
  const response = await fetch(
    `/api/mobile/content-items?${createSearch({ section })}`,
    {
      cache: "no-store",
      headers: buildMobileSessionHeaders(),
    },
  );

  return parseJson<{ items: MobileContentListItem[] }>(response);
}

export async function fetchLinkTarget(target: string, entityId?: string) {
  const response = await fetch(
    `/api/mobile/link?${createSearch({ target, entityId })}`,
    {
      cache: "no-store",
      headers: buildMobileSessionHeaders(),
    },
  );

  return parseJson<{ content: LinkTargetContent }>(response);
}

export async function sendChatMessage(input: {
  userId: string;
  sessionId: string;
  text: string;
  pregnancyWeek?: number;
  imageDataUris: string[];
}) {
  const response = await fetch("/api/mobile/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildMobileSessionHeaders(),
    },
    body: JSON.stringify(input),
  });

  return parseJson<{ assistantMessage: ChatMessage; sessionId?: string }>(response);
}

export async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("이미지 데이터를 읽지 못했습니다."));
    };

    reader.onerror = () => {
      reject(new Error("이미지 파일을 읽는 중 오류가 발생했습니다."));
    };

    reader.readAsDataURL(file);
  });
}

export async function requestPhoneVerification(input: {
  phoneNumber: string;
}) {
  const response = await fetch("/api/mobile/auth/start-phone-verification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseJson<{ ok: true }>(response);
}

export async function signInWithPhoneVerification(input: {
  phoneNumber: string;
  verificationCode: string;
}) {
  const response = await fetch("/api/mobile/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseJson<{ user: AuthenticatedUser; sessionToken?: string }>(response);
}

export async function fetchCurrentMobileSession() {
  const response = await fetch("/api/mobile/auth/session", {
    method: "GET",
    headers: buildMobileSessionHeaders(),
    cache: "no-store",
  });

  return parseJson<{ user: AuthenticatedUser }>(response);
}

export async function completeOnboarding(input: {
  userId: string;
  pregnancyWeekOrDueDate: string;
  tonePreference: string;
  themeKey?: MobileThemeKey | null;
}) {
  const response = await fetch("/api/mobile/onboarding", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildMobileSessionHeaders(),
    },
    body: JSON.stringify(input),
  });

  return parseJson<{ user: AuthenticatedUser }>(response);
}
