import { createHash } from "crypto";
import type { NextRequest } from "next/server";
import { supabaseSelect, supabaseUpdate } from "./supabase-rest";

type AuthSessionRow = {
  id: string;
  user_id: string;
  expires_at: string;
  revoked_at: string | null;
};

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

  await supabaseUpdate(`auth_sessions?id=eq.${session.id}`, {
    last_used_at: new Date().toISOString(),
  });

  return {
    sessionId: session.id,
    userId: session.user_id,
  };
}
