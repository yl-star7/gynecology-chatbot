import * as SecureStore from "expo-secure-store";

const MOBILE_SESSION_TOKEN_KEY = "phedy-mobile-session-token";
const MOBILE_USER_ID_KEY = "phedy-mobile-user-id";

async function isNativeStorageAvailable() {
  return SecureStore.isAvailableAsync();
}

export async function readNativeStorageValue(key: string) {
  if (!(await isNativeStorageAvailable())) {
    return null;
  }

  return SecureStore.getItemAsync(key);
}

export async function persistNativeStorageValue(key: string, value: string) {
  if (!(await isNativeStorageAvailable())) {
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

export async function clearNativeStorageValue(key: string) {
  if (!(await isNativeStorageAvailable())) {
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export async function readNativeSessionToken() {
  return readNativeStorageValue(MOBILE_SESSION_TOKEN_KEY);
}

export async function persistNativeSessionToken(sessionToken: string) {
  await persistNativeStorageValue(MOBILE_SESSION_TOKEN_KEY, sessionToken);
}

export async function clearNativeSessionToken() {
  await clearNativeStorageValue(MOBILE_SESSION_TOKEN_KEY);
}

export async function readNativeUserId() {
  return readNativeStorageValue(MOBILE_USER_ID_KEY);
}

export async function persistNativeUserId(userId: string) {
  await persistNativeStorageValue(MOBILE_USER_ID_KEY, userId);
}

export async function clearNativeUserId() {
  await clearNativeStorageValue(MOBILE_USER_ID_KEY);
}
