export type ServerDataProvider = "docker" | "supabase";

function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE ?? process.env.SERVICEROLE;
}

function normalizeProvider(value: string | undefined): ServerDataProvider | null {
  if (value === "docker" || value === "supabase") {
    return value;
  }

  return null;
}

export function resolveServerDataProvider(): ServerDataProvider {
  const explicitProvider = normalizeProvider(process.env.SERVER_DATA_PROVIDER);
  if (explicitProvider) {
    return explicitProvider;
  }

  if (getSupabaseServiceRoleKey() && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return "supabase";
  }

  if (process.env.DATABASE_URL) {
    return "docker";
  }

  return "supabase";
}

export function hasSupabaseConfig() {
  return Boolean(getSupabaseServiceRoleKey() && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function hasDockerConfig() {
  return Boolean(process.env.DATABASE_URL);
}
