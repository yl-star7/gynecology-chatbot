export type ServerDataProvider = "docker";

function normalizeProvider(value: string | undefined): ServerDataProvider | null {
  if (value === "docker") {
    return "docker";
  }

  return null;
}

export function resolveServerDataProvider(): ServerDataProvider {
  const explicitProvider = normalizeProvider(process.env.SERVER_DATA_PROVIDER);
  if (explicitProvider) {
    return explicitProvider;
  }

  throw new Error('SERVER_DATA_PROVIDER must be explicitly set to "docker"');
}

export function hasDockerConfig() {
  return Boolean(process.env.DATABASE_URL);
}
