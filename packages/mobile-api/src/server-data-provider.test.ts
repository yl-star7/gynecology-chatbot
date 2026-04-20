import {
  hasDockerConfig,
  hasSupabaseConfig,
  resolveServerDataProvider,
} from "./server-data-provider";

describe("resolveServerDataProvider strict mode", () => {
  const previousServerProvider = process.env.SERVER_DATA_PROVIDER;
  const previousSupabaseRole = process.env.SUPABASE_SERVICE_ROLE;
  const previousSupabaseRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const previousServiceRole = process.env.SERVICEROLE;
  const previousSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousDatabaseUrl = process.env.DATABASE_URL;

  afterEach(() => {
    if (previousServerProvider === undefined) delete process.env.SERVER_DATA_PROVIDER;
    else process.env.SERVER_DATA_PROVIDER = previousServerProvider;

    if (previousSupabaseRole === undefined) delete process.env.SUPABASE_SERVICE_ROLE;
    else process.env.SUPABASE_SERVICE_ROLE = previousSupabaseRole;

    if (previousSupabaseRoleKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousSupabaseRoleKey;

    if (previousServiceRole === undefined) delete process.env.SERVICEROLE;
    else process.env.SERVICEROLE = previousServiceRole;

    if (previousSupabaseUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousSupabaseUrl;

    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabaseUrl;
  });

  it("throws when SERVER_DATA_PROVIDER is missing", () => {
    delete process.env.SERVER_DATA_PROVIDER;

    expect(() => resolveServerDataProvider()).toThrow(
      'SERVER_DATA_PROVIDER must be explicitly set to "docker" or "supabase"',
    );
  });

  it("throws when SERVER_DATA_PROVIDER is invalid", () => {
    process.env.SERVER_DATA_PROVIDER = "auto";

    expect(() => resolveServerDataProvider()).toThrow(
      'SERVER_DATA_PROVIDER must be explicitly set to "docker" or "supabase"',
    );
  });

  it("keeps config helpers behavior", () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.DATABASE_URL = "postgres://localhost:5432/postgres";

    expect(hasSupabaseConfig()).toBe(true);
    expect(hasDockerConfig()).toBe(true);
  });
});
