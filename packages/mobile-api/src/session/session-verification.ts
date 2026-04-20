import { createHash } from "crypto";
import { supabaseSelect, supabaseUpdate } from "../supabase/admin-client.js";

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

export function extractBearerTokenFromAuthorization(
  authorization: string | null | undefined,
): string | null {
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

export async function verifyMobileSessionToken(
  sessionToken: string | null | undefined,
  expectedUserId?: string | null,
): Promise<{ sessionId: string; userId: string }> {
  if (!sessionToken) {
    throw new Error("mobile session token is required");
  }

  const sessionHash = hashSessionToken(sessionToken);
  const sessions = await supabaseSelect<AuthSessionRow[]>(
    `auth_sessions?select=id,user_id,expires_at,revoked_at&refresh_token_hash=eq.${sessionHash}&limit=1`,
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

  if (
    !user ||
    user.account_status === "paused" ||
    user.account_status === "deleted"
  ) {
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
