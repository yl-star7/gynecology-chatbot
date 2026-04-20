import type { Context } from "hono";

type StatusCode =
  | 200
  | 201
  | 204
  | 400
  | 401
  | 403
  | 404
  | 409
  | 429
  | 500
  | 503;

export function noStoreJson<T>(
  c: Context,
  payload: T,
  status: StatusCode = 200,
) {
  c.header("Cache-Control", "no-store, max-age=0");
  c.header("Pragma", "no-cache");
  return c.json(payload, status);
}
