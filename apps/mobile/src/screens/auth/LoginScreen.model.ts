const DEVELOPMENT_AUTO_VERIFIED_PHONE_NUMBERS = new Set([
  "01012345678",
  "01026784241",
]);

const DEVELOPMENT_AUTO_VERIFIED_LOGIN = {
  phoneNumber: "01012345678",
  verificationCode: "000000",
} as const;

const LOCAL_API_HOSTS = new Set(["localhost", "127.0.0.1", "10.0.2.2"]);

export function isDevelopmentAutoVerifiedPhoneNumber(phoneNumber: string) {
  return DEVELOPMENT_AUTO_VERIFIED_PHONE_NUMBERS.has(phoneNumber.trim());
}

export function getDevelopmentAutoVerifiedLogin() {
  return { ...DEVELOPMENT_AUTO_VERIFIED_LOGIN };
}

export function shouldAllowDevelopmentLoginBypass(
  isDevelopment: boolean,
  apiBaseUrl?: string,
) {
  if (!isDevelopment) {
    return false;
  }

  if (!apiBaseUrl) {
    return true;
  }

  try {
    return LOCAL_API_HOSTS.has(new URL(apiBaseUrl).hostname);
  } catch {
    return apiBaseUrl.includes("localhost");
  }
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

export function resolvePostLoginHref(hasCompletedOnboarding: boolean) {
  return hasCompletedOnboarding ? "/(tabs)/home" : "/onboarding";
}
