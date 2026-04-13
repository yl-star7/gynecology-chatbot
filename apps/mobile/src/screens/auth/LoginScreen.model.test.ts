import assert from "node:assert/strict";
import test from "node:test";
import {
  buildInitialLoginFormState,
  getDevelopmentAutoVerifiedLogin,
  isDevelopmentAutoVerifiedPhoneNumber,
  resolvePostLoginHref,
} from "./LoginScreen.model.ts";

test("resolvePostLoginHref sends onboarded users to tabs home", () => {
  assert.equal(resolvePostLoginHref(true), "/(tabs)/home");
});

test("resolvePostLoginHref sends incomplete users to onboarding", () => {
  assert.equal(resolvePostLoginHref(false), "/onboarding");
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

test("buildInitialLoginFormState starts the local dev number as already verified", () => {
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
