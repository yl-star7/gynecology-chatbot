import assert from "node:assert/strict";
import test from "node:test";
import {
  buildInitialLoginFormState,
  getDevelopmentAutoVerifiedLogin,
  isDevelopmentAutoVerifiedPhoneNumber,
  resolvePostLoginHref,
  shouldAllowDevelopmentLoginBypass,
} from "./LoginScreen.model.ts";

test("resolvePostLoginHref sends pending users to approval pending", () => {
  assert.equal(
    resolvePostLoginHref({
      accountStatus: "pending_approval",
      hasCompletedOnboarding: true,
    }),
    "/approval-pending",
  );
});

test("resolvePostLoginHref sends onboarded users to tabs home", () => {
  assert.equal(
    resolvePostLoginHref({
      accountStatus: "active",
      hasCompletedOnboarding: true,
    }),
    "/(tabs)/home",
  );
});

test("resolvePostLoginHref sends incomplete users to onboarding", () => {
  assert.equal(
    resolvePostLoginHref({
      accountStatus: "active",
      hasCompletedOnboarding: false,
    }),
    "/onboarding",
  );
});

test("isDevelopmentAutoVerifiedPhoneNumber includes the local dev login number", () => {
  assert.equal(isDevelopmentAutoVerifiedPhoneNumber("01012345678"), true);
  assert.equal(isDevelopmentAutoVerifiedPhoneNumber("01026784241"), true);
  assert.equal(isDevelopmentAutoVerifiedPhoneNumber("01000000000"), false);
});

test("getDevelopmentAutoVerifiedLogin returns the local dev credentials", () => {
  assert.deepEqual(getDevelopmentAutoVerifiedLogin(), {
    phoneNumber: "01012345678",
    verificationCode: "000000",
  });
});

test("shouldAllowDevelopmentLoginBypass is enabled in any development build", () => {
  assert.equal(
    shouldAllowDevelopmentLoginBypass(true, "http://localhost:3005"),
    true,
  );
  assert.equal(
    shouldAllowDevelopmentLoginBypass(true, "http://10.0.2.2:3005"),
    true,
  );
  assert.equal(
    shouldAllowDevelopmentLoginBypass(
      true,
      "https://agaya-api-yvdnhntt7a-du.a.run.app",
    ),
    true,
  );
  assert.equal(
    shouldAllowDevelopmentLoginBypass(false, "http://localhost:3005"),
    false,
  );
});

test("buildInitialLoginFormState starts empty when bypass is disabled", () => {
  assert.deepEqual(buildInitialLoginFormState(true), {
    phoneNumber: "01012345678",
    verificationCode: "000000",
    hasRequestedCode: true,
  });

  assert.deepEqual(buildInitialLoginFormState(false), {
    phoneNumber: "",
    verificationCode: "",
    hasRequestedCode: false,
  });
});
