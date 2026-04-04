export function resolveBackNavigation(canGoBack: boolean, backHref: string) {
  if (canGoBack) {
    return { method: "back" as const };
  }

  return {
    method: "replace" as const,
    href: backHref,
  };
}
