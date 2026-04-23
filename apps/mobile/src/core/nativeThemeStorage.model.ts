const MOBILE_THEME_KEY_PREFIX = "phedy-mobile-theme-key";

export function createNativeThemeStorageKey(userId: string) {
  return `${MOBILE_THEME_KEY_PREFIX}:${encodeURIComponent(userId)}`;
}
