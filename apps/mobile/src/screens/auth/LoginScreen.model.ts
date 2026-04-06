const DEVELOPMENT_AUTO_VERIFIED_PHONE_NUMBERS = new Set([
  "01012345678",
  "01026784241",
]);

export function isDevelopmentAutoVerifiedPhoneNumber(phoneNumber: string) {
  return DEVELOPMENT_AUTO_VERIFIED_PHONE_NUMBERS.has(phoneNumber.trim());
}

export function buildInitialLoginFormState(isDevelopment: boolean) {
  if (!isDevelopment) {
    return {
      phoneNumber: "",
      verificationCode: "",
      hasRequestedCode: false,
    };
  }

  return {
    phoneNumber: "01012345678",
    verificationCode: "000000",
    hasRequestedCode: true,
  };
}

export function resolvePostLoginHref(hasCompletedOnboarding: boolean) {
  return hasCompletedOnboarding ? "/(tabs)/home" : "/onboarding";
}
