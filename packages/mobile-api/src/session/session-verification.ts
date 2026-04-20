import { createHash } from "crypto";
import { prisma } from "@gynecology-chatbot/db/prisma";

type AuthSessionRow = {
  id: string;
  user_id: string;
  expires_at: string;
  revoked_at: string | null;
};

type SessionUserRow = {
  id: string;
  account_status: string;
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
  const sessionRecord = await prisma.auth_sessions.findFirst({
    where: { refresh_token_hash: sessionHash },
    select: {
      id: true,
      user_id: true,
      expires_at: true,
      revoked_at: true,
    },
  });
  const session: AuthSessionRow | undefined = sessionRecord
    ? {
        id: sessionRecord.id,
        user_id: sessionRecord.user_id,
        expires_at: sessionRecord.expires_at.toISOString(),
        revoked_at: sessionRecord.revoked_at?.toISOString() ?? null,
      }
    : undefined;

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

  const userRecord = await prisma.users.findUnique({
    where: { id: session.user_id },
    select: {
      id: true,
      account_status: true,
    },
  });
  const user: SessionUserRow | undefined = userRecord
    ? {
        id: userRecord.id,
        account_status: userRecord.account_status,
      }
    : undefined;

  if (
    !user ||
    user.account_status === "paused" ||
    user.account_status === "deleted"
  ) {
    throw new Error("mobile session user is not active");
  }

  await prisma.auth_sessions.update({
    where: { id: session.id },
    data: {
      last_used_at: new Date(),
    },
  });

  return {
    sessionId: session.id,
    userId: session.user_id,
  };
}
