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

export function shouldAllowDevelopmentLoginBypass(
  isDevelopment: boolean,
  // kept for signature compatibility; bypass is now allowed in any dev build
  _apiBaseUrl?: string,
) {
  return isDevelopment;
}

export function buildInitialLoginFormState(allowDevelopmentBypass: boolean) {
  if (!allowDevelopmentBypass) {
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

export function resolvePostLoginHref(user: {
  accountStatus?: string;
  hasCompletedOnboarding: boolean;
}) {
  if (user.accountStatus === "pending_approval") {
    return "/approval-pending";
  }

  return user.hasCompletedOnboarding ? "/(tabs)/home" : "/onboarding";
}
