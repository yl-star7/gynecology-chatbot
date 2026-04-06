import assert from "node:assert/strict";
import test from "node:test";
import { createMobileServices } from "./createMobileServices.ts";

test("createMobileServices rejects when provider is not explicitly configured", () => {
  const originalProvider = process.env.EXPO_PUBLIC_MOBILE_DATA_PROVIDER;
  delete process.env.EXPO_PUBLIC_MOBILE_DATA_PROVIDER;

  try {
    assert.throws(
      () => createMobileServices(),
      /EXPO_PUBLIC_MOBILE_DATA_PROVIDER must be explicitly set to "api" or "mock"/,
    );
  } finally {
    if (originalProvider === undefined) {
      delete process.env.EXPO_PUBLIC_MOBILE_DATA_PROVIDER;
    } else {
      process.env.EXPO_PUBLIC_MOBILE_DATA_PROVIDER = originalProvider;
    }
  }
});

test("createMobileServices rejects when provider value is invalid", () => {
  const originalProvider = process.env.EXPO_PUBLIC_MOBILE_DATA_PROVIDER;
  process.env.EXPO_PUBLIC_MOBILE_DATA_PROVIDER = "invalid";

  try {
    assert.throws(
      () => createMobileServices(),
      /EXPO_PUBLIC_MOBILE_DATA_PROVIDER must be explicitly set to "api" or "mock"/,
    );
  } finally {
    if (originalProvider === undefined) {
      delete process.env.EXPO_PUBLIC_MOBILE_DATA_PROVIDER;
    } else {
      process.env.EXPO_PUBLIC_MOBILE_DATA_PROVIDER = originalProvider;
    }
  }
});

test("createMobileServices exposes survey branding through the profile port", async () => {
  const services = createMobileServices({ provider: "mock" });

  const branding = await services.profilePort.getBranding();

  assert.deepEqual(branding, {
    surveyFormUrl: null,
  });
});
