export function resolvePostLoginHref(hasCompletedOnboarding: boolean) {
  return hasCompletedOnboarding ? "/(tabs)/home" : "/onboarding";
}
