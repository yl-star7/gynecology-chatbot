import { createHash } from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { supabaseSelect, supabaseUpdate } from "./supabase-rest";

type AuthSessionRow = {
  id: string;
  user_id: string;
  expires_at: string;
  revoked_at: string | null;
};

type SessionUserRow = {
  id: string;
  account_status: "active" | "paused" | "deleted" | "pending_recovery";
};

const MOBILE_SESSION_FAILURE_MESSAGES = new Set([
  "mobile session token is required",
  "invalid mobile session",
  "mobile session has been revoked",
  "mobile session has expired",
  "mobile session user mismatch",
  "mobile session user is not active",
]);

function hashSessionToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function extractBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  return token.trim();
}

export function isMobileSessionError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    MOBILE_SESSION_FAILURE_MESSAGES.has(error.message)
  );
}

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

export async function requireMobileSession(
  request: NextRequest,
  expectedUserId?: string | null,
) {
  const sessionToken = extractBearerToken(request);
  if (!sessionToken) {
    throw new Error("mobile session token is required");
  }

  const sessionHash = hashSessionToken(sessionToken);
  const sessions = await supabaseSelect<AuthSessionRow[]>(
    `auth_sessions?select=id,user_id,expires_at,revoked_at&refresh_token_hash=eq.${encodeURIComponent(sessionHash)}&limit=1`,
  );
  const session = sessions[0];

  if (!session) {
    throw new Error("invalid mobile session");
  }

  if (session.revoked_at) {
    throw new Error("mobile session has been revoked");
  }

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    throw new Error("mobile session has expired");
  }

  if (expectedUserId && expectedUserId !== session.user_id) {
    throw new Error("mobile session user mismatch");
  }

  const users = await supabaseSelect<SessionUserRow[]>(
    `users?select=id,account_status&id=eq.${session.user_id}&limit=1`,
  );
  const user = users[0];

  if (!user || user.account_status === "paused" || user.account_status === "deleted") {
    throw new Error("mobile session user is not active");
  }

  await supabaseUpdate(`auth_sessions?id=eq.${session.id}`, {
    last_used_at: new Date().toISOString(),
  });

  return {
    sessionId: session.id,
    userId: session.user_id,
  };
}
