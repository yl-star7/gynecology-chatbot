"use client";

import type {
  AuthenticatedUser,
  ChatMessage,
  ChatSession,
  HomeViewData,
  LinkTargetContent,
  MobileProfileViewData,
  RecentChatSummary,
  RecordDayView,
} from "@gynecology-chatbot/app-core";

type ApiErrorPayload = {
  error?: string;
};

export function resolveMobileUserId(explicitUserId?: string | null) {
  if (explicitUserId) {
    return explicitUserId;
  }

  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_DEV_USER_ID ?? null;
  }

  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get("userId") ?? process.env.NEXT_PUBLIC_DEV_USER_ID ?? null;
}

export function appendUserIdToPath(path: string, explicitUserId?: string | null) {
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
    throw new Error(payload.error ?? `Request failed: ${response.status}`);
  }

  return payload;
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
  return `session-${Date.now()}`;
}

export async function fetchHome(userId: string, month?: string) {
  const response = await fetch(`/api/mobile/home?${createSearch({ userId, month })}`, {
    cache: "no-store",
  });

  return parseJson<{ home: HomeViewData }>(response);
}

export async function fetchSessions(userId: string) {
  const response = await fetch(`/api/mobile/sessions?${createSearch({ userId })}`, {
    cache: "no-store",
  });

  return parseJson<{ sessions: RecentChatSummary[] }>(response);
}

export async function fetchRecordDay(userId: string, isoDate: string) {
  const response = await fetch(`/api/mobile/records?${createSearch({ userId, date: isoDate })}`, {
    cache: "no-store",
  });

  return parseJson<{ recordDay: RecordDayView }>(response);
}

export async function fetchMobileProfile(userId: string) {
  const response = await fetch(`/api/mobile/profile?${createSearch({ userId })}`, {
    cache: "no-store",
  });

  return parseJson<{ profile: MobileProfileViewData }>(response);
}

export async function updateMobileProfile(input: {
  userId: string;
  displayName: string;
  dueDate?: string | null;
  tonePreference: string;
  babyNickname?: string | null;
  hospitalName?: string | null;
  notificationTime?: string | null;
}) {
  const response = await fetch("/api/mobile/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseJson<{ user: AuthenticatedUser }>(response);
}

export async function fetchSession(userId: string, sessionId: string) {
  const response = await fetch(`/api/mobile/sessions/${encodeURIComponent(sessionId)}?${createSearch({ userId })}`, {
    cache: "no-store",
  });

  return parseJson<{ session: ChatSession }>(response);
}

export async function fetchLinkTarget(target: string, entityId?: string) {
  const response = await fetch(`/api/mobile/link?${createSearch({ target, entityId })}`, {
    cache: "no-store",
  });

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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseJson<{ assistantMessage: ChatMessage }>(response);
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

export async function signInWithPhonePassword(input: { phoneNumber: string; password: string }) {
  const response = await fetch("/api/mobile/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseJson<{ user: AuthenticatedUser }>(response);
}

export async function verifyPhone(input: { phoneNumber: string; verificationCode: string }) {
  const response = await fetch("/api/mobile/auth/verify-phone", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseJson<{ verificationToken: string }>(response);
}

export async function setPassword(input: { verificationToken: string; password: string }) {
  const response = await fetch("/api/mobile/auth/set-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseJson<{ user: AuthenticatedUser }>(response);
}

export async function requestPasswordReset(input: { phoneNumber: string }) {
  const response = await fetch("/api/mobile/auth/request-password-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseJson<{ ok: true }>(response);
}

export async function completeOnboarding(input: {
  userId: string;
  pregnancyWeekOrDueDate: string;
  tonePreference: string;
}) {
  const response = await fetch("/api/mobile/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseJson<{ user: AuthenticatedUser }>(response);
}
