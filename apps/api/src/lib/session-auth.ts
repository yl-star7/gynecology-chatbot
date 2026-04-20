import type { Context } from "hono";
import {
  extractBearerTokenFromAuthorization,
  isMobileSessionError,
  verifyMobileSessionToken,
} from "@gynecology-chatbot/mobile-api/session/session-verification";

export { isMobileSessionError };

export async function requireMobileSession(
  c: Context,
  expectedUserId?: string | null,
) {
  const authorization = c.req.header("authorization");
  const token = extractBearerTokenFromAuthorization(authorization ?? null);
  return verifyMobileSessionToken(token, expectedUserId ?? null);
}

export function mobileRouteErrorResponse(
  c: Context,
  error: unknown,
  fallbackMessage: string,
  fallbackStatus = 500,
) {
  if (isMobileSessionError(error)) {
    return c.json({ error: error.message }, 401);
  }

  return c.json(
    {
      error: error instanceof Error ? error.message : fallbackMessage,
    },
    fallbackStatus as 400 | 401 | 404 | 409 | 500,
  );
}
