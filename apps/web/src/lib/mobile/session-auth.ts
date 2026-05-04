import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  extractBearerTokenFromAuthorization,
  isMobileSessionError,
  verifyMobileSessionToken,
} from "@gynecology-chatbot/mobile-api/session/session-verification";

export { isMobileSessionError };

export function mobileRouteErrorResponse(
  error: unknown,
  fallbackMessage: string,
  fallbackStatus = 500,
) {
  if (isMobileSessionError(error)) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : fallbackMessage,
    },
    { status: fallbackStatus },
  );
}

export function mobileNoStoreJson<T>(payload: T, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store, max-age=0");
  headers.set("Pragma", "no-cache");

  return NextResponse.json(payload, {
    ...init,
    headers,
  });
}

type RequireMobileSessionOptions = {
  requireApproved?: boolean;
};

export async function requireMobileSession(
  request: NextRequest | Request,
  expectedUserId?: string | null,
  options: RequireMobileSessionOptions = { requireApproved: true },
) {
  const authorization = request.headers.get("authorization");
  const token = extractBearerTokenFromAuthorization(authorization);
  return verifyMobileSessionToken(token, expectedUserId, options);
}
