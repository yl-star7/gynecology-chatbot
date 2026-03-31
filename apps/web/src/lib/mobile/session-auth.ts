import { createHash } from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";

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
    error instanceof Error && MOBILE_SESSION_FAILURE_MESSAGES.has(error.message)
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
  const client = getSupabaseAdminClient();
  const sessionToken = extractBearerToken(request);
  if (!sessionToken) {
    throw new Error("mobile session token is required");
  }

  const sessionHash = hashSessionToken(sessionToken);
  const { data: sessions, error: sessionError } = await client
    .from("auth_sessions")
    .select("id,user_id,expires_at,revoked_at")
    .eq("refresh_token_hash", sessionHash)
    .limit(1);
  if (sessionError) {
    throw sessionError;
  }
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

  const { data: users, error: userError } = await client
    .from("users")
    .select("id,account_status")
    .eq("id", session.user_id)
    .limit(1);
  if (userError) {
    throw userError;
  }
  const user = users[0];

  if (
    !user ||
    user.account_status === "paused" ||
    user.account_status === "deleted"
  ) {
    throw new Error("mobile session user is not active");
  }

  const { error: updateError } = await client
    .from("auth_sessions")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", session.id);
  if (updateError) {
    throw updateError;
  }

  return {
    sessionId: session.id,
    userId: session.user_id,
  };
}
