import * as SecureStore from "expo-secure-store";

const MOBILE_SESSION_TOKEN_KEY = "phedy-mobile-session-token";

export async function readNativeSessionToken() {
  if (!(await SecureStore.isAvailableAsync())) {
    return null;
  }

  return SecureStore.getItemAsync(MOBILE_SESSION_TOKEN_KEY);
}

export async function persistNativeSessionToken(sessionToken: string) {
  if (!(await SecureStore.isAvailableAsync())) {
    return;
  }

  await SecureStore.setItemAsync(MOBILE_SESSION_TOKEN_KEY, sessionToken);
}

export async function clearNativeSessionToken() {
  if (!(await SecureStore.isAvailableAsync())) {
    return;
  }

  await SecureStore.deleteItemAsync(MOBILE_SESSION_TOKEN_KEY);
}
