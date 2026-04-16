import * as SecureStore from "expo-secure-store";

const MOBILE_SESSION_TOKEN_KEY = "phedy-mobile-session-token";
const MOBILE_USER_ID_KEY = "phedy-mobile-user-id";
const NATIVE_STORAGE_CHUNK_SIZE = 480;

async function isNativeStorageAvailable() {
  return SecureStore.isAvailableAsync();
}

function createChunkMetaKey(key: string) {
  return `${key}-meta`;
}

function createChunkKey(key: string, index: number) {
  return `${key}-chunk-${index}`;
}

async function readNativeChunkCount(key: string) {
  const rawValue = await readNativeStorageValue(createChunkMetaKey(key));
  if (!rawValue) {
    return null;
  }

  const count = Number(rawValue);
  if (!Number.isInteger(count) || count < 1) {
    return null;
  }

  return count;
}

function splitNativeStorageChunks(value: string) {
  if (value.length === 0) {
    return [""];
  }

  const chunks: string[] = [];
  for (let index = 0; index < value.length; index += NATIVE_STORAGE_CHUNK_SIZE) {
    chunks.push(value.slice(index, index + NATIVE_STORAGE_CHUNK_SIZE));
  }

  return chunks;
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

export async function readNativeChunkedValue(key: string) {
  const chunkCount = await readNativeChunkCount(key);
  if (!chunkCount) {
    return null;
  }

  const chunks: string[] = [];
  for (let index = 0; index < chunkCount; index += 1) {
    const chunkValue = await readNativeStorageValue(createChunkKey(key, index));
    if (chunkValue === null) {
      await clearNativeChunkedValue(key);
      return null;
    }
    chunks.push(chunkValue);
  }

  return chunks.join("");
}

export async function persistNativeChunkedValue(key: string, value: string) {
  const previousChunkCount = await readNativeChunkCount(key);
  const chunks = splitNativeStorageChunks(value);

  for (const [index, chunkValue] of chunks.entries()) {
    await persistNativeStorageValue(createChunkKey(key, index), chunkValue);
  }

  await persistNativeStorageValue(createChunkMetaKey(key), String(chunks.length));

  if (previousChunkCount && previousChunkCount > chunks.length) {
    for (let index = chunks.length; index < previousChunkCount; index += 1) {
      await clearNativeStorageValue(createChunkKey(key, index));
    }
  }
}

export async function clearNativeChunkedValue(key: string) {
  const chunkCount = await readNativeChunkCount(key);
  if (chunkCount) {
    for (let index = 0; index < chunkCount; index += 1) {
      await clearNativeStorageValue(createChunkKey(key, index));
    }
  }

  await clearNativeStorageValue(createChunkMetaKey(key));
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
