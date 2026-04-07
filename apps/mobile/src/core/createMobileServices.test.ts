import assert from "node:assert/strict";
import test from "node:test";
import { createMobileServices } from "./createMobileServices.ts";

test("createMobileServices defaults to api provider when env var is missing", () => {
  const originalProvider = process.env.EXPO_PUBLIC_MOBILE_DATA_PROVIDER;
  delete process.env.EXPO_PUBLIC_MOBILE_DATA_PROVIDER;

  try {
    const services = createMobileServices();
    assert.ok(services, "should create services with default api provider");
  } finally {
    if (originalProvider === undefined) {
      delete process.env.EXPO_PUBLIC_MOBILE_DATA_PROVIDER;
    } else {
      process.env.EXPO_PUBLIC_MOBILE_DATA_PROVIDER = originalProvider;
    }
  }
});

test("createMobileServices accepts explicit provider option", () => {
  const services = createMobileServices({ provider: "mock" });
  assert.ok(services, "should create services with explicit mock provider");
});

test("createMobileServices exposes survey branding through the profile port", async () => {
  const services = createMobileServices({ provider: "mock" });

  const branding = await services.profilePort.getBranding();

  assert.deepEqual(branding, {
    surveyFormUrl: null,
  });
});
