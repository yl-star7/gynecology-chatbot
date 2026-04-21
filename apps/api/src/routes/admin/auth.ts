import { timingSafeEqual } from "crypto";
import { createMiddleware } from "hono/factory";

export type AdminProxyVariables = {
  adminUserId: string;
};

function getAdminProxySecret() {
  return (
    process.env.ADMIN_API_PROXY_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    ""
  );
}

function isSafeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export const requireAdminProxy = createMiddleware<{
  Variables: AdminProxyVariables;
}>(async (c, next) => {
  const expectedSecret = getAdminProxySecret();
  const providedSecret = c.req.header("x-admin-proxy-secret") ?? "";
  const adminUserId = c.req.header("x-admin-user-id")?.trim();

  if (
    !expectedSecret ||
    !providedSecret ||
    !adminUserId ||
    !isSafeEqual(providedSecret, expectedSecret)
  ) {
    return c.json({ error: "unauthorized" }, 401);
  }

  c.set("adminUserId", adminUserId);
  await next();
});
