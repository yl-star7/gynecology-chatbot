const MOBILE_THEME_KEY_PREFIX = "phedy-mobile-theme-key";

function encodeNativeStorageKeyPart(value: string) {
  const encodedValue = Array.from(value, (character) =>
    character.codePointAt(0)?.toString(16),
  )
    .filter(Boolean)
    .join(".");

  return encodedValue || "empty";
}

export function createNativeThemeStorageKey(userId: string) {
  return `${MOBILE_THEME_KEY_PREFIX}.${encodeNativeStorageKeyPart(userId)}`;
}
