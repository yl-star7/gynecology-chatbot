import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export function noStoreJson<T>(
  c: Context,
  payload: T,
  status: ContentfulStatusCode = 200,
) {
  c.header("Cache-Control", "no-store, max-age=0");
  c.header("Pragma", "no-cache");
  return c.json(payload, status);
}
