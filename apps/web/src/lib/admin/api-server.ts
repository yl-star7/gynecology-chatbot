import { NextResponse } from "next/server";

type AdminProxyUser = {
  id: string;
};

function getAdminApiBaseUrl() {
  const value = process.env.ADMIN_API_BASE_URL?.trim();
  if (!value) {
    throw new Error("ADMIN_API_BASE_URL is required for admin API requests");
  }

  return value.replace(/\/$/, "");
}

function getAdminApiProxySecret() {
  const secret =
    process.env.ADMIN_API_PROXY_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "ADMIN_API_PROXY_SECRET or ADMIN_SESSION_SECRET is required for admin API requests",
    );
  }

  return secret;
}

function copyRequestHeaders(request: Request | null) {
  const headers = new Headers();
  const contentType = request?.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  return headers;
}

function buildResponseHeaders(response: Response) {
  const headers = new Headers();
  const contentType = response.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    headers.set("retry-after", retryAfter);
  }
  headers.set("cache-control", "no-store");
  return headers;
}

export async function proxyAdminApiRequest(
  path: string,
  input: {
    admin: AdminProxyUser;
    request?: Request | null;
    method?: string;
  },
) {
  const method =
    input.method ?? input.request?.method.toUpperCase() ?? "GET";
  const headers = copyRequestHeaders(input.request ?? null);
  headers.set("x-admin-user-id", input.admin.id);
  headers.set("x-admin-proxy-secret", getAdminApiProxySecret());

  const body =
    input.request && method !== "GET" && method !== "HEAD"
      ? Buffer.from(await input.request.arrayBuffer())
      : undefined;

  const response = await fetch(`${getAdminApiBaseUrl()}/api/admin/${path}`, {
    method,
    headers,
    body,
    cache: "no-store",
  });

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: buildResponseHeaders(response),
  });
}
