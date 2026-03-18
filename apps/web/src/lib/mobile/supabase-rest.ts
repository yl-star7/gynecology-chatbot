import {
  localSupabaseDelete,
  localSupabaseInsert,
  localSupabaseRpc,
  localSupabaseSelect,
  localSupabaseUpdate,
} from "./local-postgres";
import {
  hasDockerConfig,
  hasSupabaseConfig,
  resolveServerDataProvider,
} from "../server-data-provider";

const jsonHeaders = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

function getSupabaseServiceRoleKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE ??
    process.env.SERVICEROLE
  );
}

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase REST configuration is missing");
  }

  return { url: url.replace(/\/$/, ""), serviceRoleKey };
}

function shouldUseLocalPostgres() {
  return resolveServerDataProvider() === "docker";
}

function assertSelectedProviderConfig() {
  const provider = resolveServerDataProvider();

  if (provider === "docker" && !hasDockerConfig()) {
    throw new Error("SERVER_DATA_PROVIDER=docker requires DATABASE_URL");
  }

  if (provider === "supabase" && !hasSupabaseConfig()) {
    throw new Error(
      "SERVER_DATA_PROVIDER=supabase requires NEXT_PUBLIC_SUPABASE_URL and a service-role key (SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SERVICE_ROLE, or SERVICEROLE)",
    );
  }
}

function buildHeaders(prefer?: string) {
  const { serviceRoleKey } = getConfig();
  return {
    ...jsonHeaders,
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

export async function supabaseSelect<T>(path: string) {
  assertSelectedProviderConfig();
  if (shouldUseLocalPostgres()) {
    return localSupabaseSelect<T>(path);
  }

  const { url } = getConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method: "GET",
    headers: buildHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase select failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function supabaseInsert<T>(
  table: string,
  payload: object | object[],
) {
  assertSelectedProviderConfig();
  if (shouldUseLocalPostgres()) {
    return localSupabaseInsert<T>(table, payload);
  }

  const { url } = getConfig();
  const response = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: buildHeaders("return=representation"),
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase insert failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function supabaseUpdate<T>(path: string, payload: object) {
  assertSelectedProviderConfig();
  if (shouldUseLocalPostgres()) {
    return localSupabaseUpdate<T>(path, payload);
  }

  const { url } = getConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method: "PATCH",
    headers: buildHeaders("return=representation"),
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase update failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function supabaseDelete<T>(path: string) {
  assertSelectedProviderConfig();
  if (shouldUseLocalPostgres()) {
    return localSupabaseDelete<T>(path);
  }

  const { url } = getConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method: "DELETE",
    headers: buildHeaders("return=representation"),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase delete failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function supabaseRpc<T>(fn: string, payload: object) {
  assertSelectedProviderConfig();
  if (shouldUseLocalPostgres()) {
    return localSupabaseRpc<T>(fn, payload as Record<string, unknown>);
  }

  const { url } = getConfig();
  const response = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase rpc failed: ${response.status}`);
  }

  return (await response.json()) as T;
}
