const DEVELOPMENT_AUTO_VERIFIED_PHONE_NUMBERS = new Set([
  "01012345678",
  "01026784241",
]);

const DEVELOPMENT_AUTO_VERIFIED_LOGIN = {
  phoneNumber: "01012345678",
  verificationCode: "000000",
} as const;

export function isDevelopmentAutoVerifiedPhoneNumber(phoneNumber: string) {
  return DEVELOPMENT_AUTO_VERIFIED_PHONE_NUMBERS.has(phoneNumber.trim());
}

export function getDevelopmentAutoVerifiedLogin() {
  return { ...DEVELOPMENT_AUTO_VERIFIED_LOGIN };
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
    ...getDevelopmentAutoVerifiedLogin(),
    hasRequestedCode: true,
  };
}

export function resolvePostLoginHref(hasCompletedOnboarding: boolean) {
  return hasCompletedOnboarding ? "/(tabs)/home" : "/onboarding";
}
