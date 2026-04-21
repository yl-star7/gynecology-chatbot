import {
  hasDockerConfig,
  resolveServerDataProvider,
} from "./server-data-provider";

describe("resolveServerDataProvider strict mode", () => {
  const previousServerProvider = process.env.SERVER_DATA_PROVIDER;
  const previousDatabaseUrl = process.env.DATABASE_URL;

  afterEach(() => {
    if (previousServerProvider === undefined) delete process.env.SERVER_DATA_PROVIDER;
    else process.env.SERVER_DATA_PROVIDER = previousServerProvider;

    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabaseUrl;
  });

  it("throws when SERVER_DATA_PROVIDER is missing", () => {
    delete process.env.SERVER_DATA_PROVIDER;

    expect(() => resolveServerDataProvider()).toThrow(
      'SERVER_DATA_PROVIDER must be explicitly set to "docker"',
    );
  });

  it("throws when SERVER_DATA_PROVIDER is invalid", () => {
    process.env.SERVER_DATA_PROVIDER = "auto";

    expect(() => resolveServerDataProvider()).toThrow(
      'SERVER_DATA_PROVIDER must be explicitly set to "docker"',
    );
  });

  it("keeps config helpers behavior", () => {
    process.env.DATABASE_URL = "postgres://localhost:5432/postgres";

    expect(hasDockerConfig()).toBe(true);
  });
});
