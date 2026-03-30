import { request, type FullConfig } from "@playwright/test";

function requireE2EEnv(name: keyof NodeJS.ProcessEnv) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

async function globalSetup(config: FullConfig) {
  const baseURL = requireE2EEnv("E2E_BASE_URL");
  const adminPhoneNumber = requireE2EEnv("E2E_ADMIN_PHONE_NUMBER");
  const adminPassword = requireE2EEnv("E2E_ADMIN_PASSWORD");

  const context = await request.newContext({ baseURL });

  const response = await context.post("/api/admin/auth/login", {
    data: { phoneNumber: adminPhoneNumber, password: adminPassword },
  });

  if (!response.ok()) {
    throw new Error(`Admin login failed: ${response.status()} ${await response.text()}`);
  }

  // Save storage state for authenticated tests
  await context.storageState({ path: "e2e/.auth/admin.json" });
  await context.dispose();
}

export default globalSetup;
