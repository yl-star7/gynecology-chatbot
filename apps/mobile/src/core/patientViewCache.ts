import type {
  ChatSession,
  HomeViewData,
  MobilePregnancyWeekSummary,
  MobileProfileViewData,
  RecentChatSummary,
  RecordDayView,
  TodayViewData,
} from "@gynecology-chatbot/app-core";
import {
  clearNativeChunkedValue,
  clearNativeStorageValue,
  persistNativeChunkedValue,
  persistNativeStorageValue,
  readNativeChunkedValue,
  readNativeStorageValue,
} from "./nativeSessionStorage";

const VIEW_CACHE_TTL_MS = 60 * 1000;
const PATIENT_VIEW_CACHE_VERSION = 1;
const PATIENT_VIEW_CACHE_STORAGE_PREFIX = "phedy-mobile-patient-view-cache";
const PATIENT_VIEW_CACHE_USERS_KEY = `${PATIENT_VIEW_CACHE_STORAGE_PREFIX}-users`;

type CacheEntry<T> = {
  value: T;
  updatedAt: number;
};

type PersistedPatientViewCache = {
  version: number;
  profile: CacheEntry<MobileProfileViewData> | null;
  home: CacheEntry<HomeViewData> | null;
  today: CacheEntry<TodayViewData> | null;
  recentChats: CacheEntry<RecentChatSummary[]> | null;
  recordDays: Array<[string, CacheEntry<RecordDayView>]>;
};

const profileCache = new Map<string, CacheEntry<MobileProfileViewData>>();
const homeCache = new Map<string, CacheEntry<HomeViewData>>();
const todayCache = new Map<string, CacheEntry<TodayViewData>>();
const recordDayCache = new Map<string, CacheEntry<RecordDayView>>();
const recentChatsCache = new Map<string, CacheEntry<RecentChatSummary[]>>();
const chatSessionCache = new Map<string, CacheEntry<ChatSession>>();

let persistedPatientViewCacheQueue: Promise<void> = Promise.resolve();

function isFreshEntry<T>(entry?: CacheEntry<T>) {
  if (!entry) {
    return false;
  }

  return Date.now() - entry.updatedAt < VIEW_CACHE_TTL_MS;
}

function readCacheValue<T>(
  cache: Map<string, CacheEntry<T>>,
  key?: string | null,
): T | null {
  if (!key) {
    return null;
  }

  return cache.get(key)?.value ?? null;
}

function cacheValue<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  value: T,
) {
  cache.set(key, {
    value,
    updatedAt: Date.now(),
  });
}

function clearCacheKey<T>(
  cache: Map<string, CacheEntry<T>>,
  key?: string | null,
) {
  if (!key) {
    return;
  }

  cache.delete(key);
}

function createRecordDayCacheKey(userId: string, isoDate: string) {
  return `${userId}:${isoDate}`;
}

function createChatSessionCacheKey(userId: string, sessionId: string) {
  return `${userId}:${sessionId}`;
}

function createPersistedPatientViewCacheKey(userId: string) {
  return `${PATIENT_VIEW_CACHE_STORAGE_PREFIX}-${userId}`;
}

function queuePersistedPatientViewCacheOperation(
  operation: () => Promise<void>,
) {
  const nextOperation = persistedPatientViewCacheQueue
    .catch(() => undefined)
    .then(operation);

  persistedPatientViewCacheQueue = nextOperation.catch(() => undefined);

  return nextOperation;
}

async function waitForPersistedPatientViewCacheOperations() {
  await persistedPatientViewCacheQueue;
}

function isCacheEntryShape(value: unknown): value is CacheEntry<unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (
    "updatedAt" in value &&
    typeof (value as { updatedAt?: unknown }).updatedAt === "number" &&
    "value" in value
  );
}

function isNullableCacheEntryShape(value: unknown) {
  return value === null || value === undefined || isCacheEntryShape(value);
}

function isPersistedRecordDayEntry(
  value: unknown,
): value is [string, CacheEntry<RecordDayView>] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "string" &&
    isCacheEntryShape(value[1])
  );
}

function isPersistedPatientViewCache(
  value: unknown,
): value is PersistedPatientViewCache {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const cache = value as Partial<PersistedPatientViewCache>;

  return (
    cache.version === PATIENT_VIEW_CACHE_VERSION &&
    isNullableCacheEntryShape(cache.profile) &&
    isNullableCacheEntryShape(cache.home) &&
    isNullableCacheEntryShape(cache.today) &&
    isNullableCacheEntryShape(cache.recentChats) &&
    Array.isArray(cache.recordDays) &&
    cache.recordDays.every(isPersistedRecordDayEntry)
  );
}

function clearMemoryPatientViewCaches(userId?: string | null) {
  if (!userId) {
    profileCache.clear();
    homeCache.clear();
    todayCache.clear();
    recordDayCache.clear();
    recentChatsCache.clear();
    chatSessionCache.clear();
    return;
  }

  clearCachedProfileView(userId);
  clearCachedHomeView(userId);
  clearCachedTodayView(userId);
  clearCachedRecentChats(userId);

  Array.from(recordDayCache.keys()).forEach((key) => {
    if (key.startsWith(`${userId}:`)) {
      recordDayCache.delete(key);
    }
  });

  Array.from(chatSessionCache.keys()).forEach((key) => {
    if (key.startsWith(`${userId}:`)) {
      chatSessionCache.delete(key);
    }
  });
}

function collectRecordDayEntries(userId: string) {
  return Array.from(recordDayCache.entries()).flatMap(([key, entry]) => {
    if (!key.startsWith(`${userId}:`)) {
      return [];
    }

    return [
      [key.slice(userId.length + 1), entry] as [
        string,
        CacheEntry<RecordDayView>,
      ],
    ];
  });
}

function createPersistedPatientViewCacheSnapshot(
  userId: string,
): PersistedPatientViewCache {
  return {
    version: PATIENT_VIEW_CACHE_VERSION,
    profile: profileCache.get(userId) ?? null,
    home: homeCache.get(userId) ?? null,
    today: todayCache.get(userId) ?? null,
    recentChats: recentChatsCache.get(userId) ?? null,
    recordDays: collectRecordDayEntries(userId),
  };
}

function hasPersistedPatientViewCacheContent(
  snapshot: PersistedPatientViewCache,
) {
  return Boolean(
    snapshot.profile ||
    snapshot.home ||
    snapshot.today ||
    snapshot.recentChats ||
    snapshot.recordDays.length > 0,
  );
}

async function readPersistedPatientViewCacheUsers() {
  const rawValue = await readNativeStorageValue(PATIENT_VIEW_CACHE_USERS_KEY);
  if (!rawValue) {
    return [] as string[];
  }

  try {
    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsedValue)) {
      await clearNativeStorageValue(PATIENT_VIEW_CACHE_USERS_KEY);
      return [];
    }

    return parsedValue.filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    );
  } catch {
    await clearNativeStorageValue(PATIENT_VIEW_CACHE_USERS_KEY);
    return [];
  }
}

async function persistPersistedPatientViewCacheUsers(userIds: string[]) {
  if (userIds.length === 0) {
    await clearNativeStorageValue(PATIENT_VIEW_CACHE_USERS_KEY);
    return;
  }

  await persistNativeStorageValue(
    PATIENT_VIEW_CACHE_USERS_KEY,
    JSON.stringify(userIds),
  );
}

async function addPersistedPatientViewCacheUser(userId: string) {
  const userIds = await readPersistedPatientViewCacheUsers();
  if (userIds.includes(userId)) {
    return;
  }

  await persistPersistedPatientViewCacheUsers([...userIds, userId]);
}

async function removePersistedPatientViewCacheUser(userId: string) {
  const userIds = await readPersistedPatientViewCacheUsers();
  if (!userIds.includes(userId)) {
    return;
  }

  await persistPersistedPatientViewCacheUsers(
    userIds.filter((persistedUserId) => persistedUserId !== userId),
  );
}

async function persistPatientViewCacheSnapshot(userId: string) {
  const snapshot = createPersistedPatientViewCacheSnapshot(userId);

  if (!hasPersistedPatientViewCacheContent(snapshot)) {
    await clearNativeChunkedValue(createPersistedPatientViewCacheKey(userId));
    await removePersistedPatientViewCacheUser(userId);
    return;
  }

  await persistNativeChunkedValue(
    createPersistedPatientViewCacheKey(userId),
    JSON.stringify(snapshot),
  );
  await addPersistedPatientViewCacheUser(userId);
}

function schedulePersistedPatientViewCache(userId: string) {
  void queuePersistedPatientViewCacheOperation(async () => {
    await persistPatientViewCacheSnapshot(userId);
  }).catch(() => undefined);
}

export async function hydratePatientViewCaches(userId?: string | null) {
  if (!userId) {
    return;
  }

  await waitForPersistedPatientViewCacheOperations();

  const rawValue = await readNativeChunkedValue(
    createPersistedPatientViewCacheKey(userId),
  );

  if (!rawValue) {
    return;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!isPersistedPatientViewCache(parsedValue)) {
      await clearPersistedPatientViewCaches(userId);
      return;
    }

    clearMemoryPatientViewCaches(userId);

    if (parsedValue.profile) {
      profileCache.set(userId, parsedValue.profile);
    }

    if (parsedValue.home) {
      homeCache.set(userId, parsedValue.home);
    }

    if (parsedValue.today) {
      todayCache.set(userId, parsedValue.today);
    }

    if (parsedValue.recentChats) {
      recentChatsCache.set(userId, parsedValue.recentChats);
    }

    parsedValue.recordDays.forEach(([isoDate, entry]) => {
      recordDayCache.set(createRecordDayCacheKey(userId, isoDate), entry);
    });
  } catch {
    await clearPersistedPatientViewCaches(userId);
  }
}

export async function clearPersistedPatientViewCaches(userId?: string | null) {
  await queuePersistedPatientViewCacheOperation(async () => {
    if (!userId) {
      const persistedUserIds = await readPersistedPatientViewCacheUsers();
      for (const persistedUserId of persistedUserIds) {
        await clearNativeChunkedValue(
          createPersistedPatientViewCacheKey(persistedUserId),
        );
      }
      await clearNativeStorageValue(PATIENT_VIEW_CACHE_USERS_KEY);
      return;
    }

    await clearNativeChunkedValue(createPersistedPatientViewCacheKey(userId));
    await removePersistedPatientViewCacheUser(userId);
  });
}

export function readCachedProfileView(userId?: string | null) {
  return readCacheValue(profileCache, userId);
}

export function hasFreshCachedProfileView(userId?: string | null) {
  if (!userId) {
    return false;
  }

  return isFreshEntry(profileCache.get(userId));
}

export function cacheProfileView(
  userId: string,
  profile: MobileProfileViewData,
) {
  cacheValue(profileCache, userId, profile);
  schedulePersistedPatientViewCache(userId);
}

export function clearCachedProfileView(userId?: string | null) {
  clearCacheKey(profileCache, userId);
  if (userId) {
    schedulePersistedPatientViewCache(userId);
  }
}

export function readCachedHomeView(userId?: string | null) {
  return readCacheValue(homeCache, userId);
}

export function hasFreshCachedHomeView(userId?: string | null) {
  if (!userId) {
    return false;
  }

  return isFreshEntry(homeCache.get(userId));
}

export function cacheHomeView(userId: string, home: HomeViewData) {
  cacheValue(homeCache, userId, home);
  schedulePersistedPatientViewCache(userId);
}

export function clearCachedHomeView(userId?: string | null) {
  clearCacheKey(homeCache, userId);
  if (userId) {
    schedulePersistedPatientViewCache(userId);
  }
}

export function readCachedTodayView(userId?: string | null) {
  return readCacheValue(todayCache, userId);
}

export function hasFreshCachedTodayView(userId?: string | null) {
  if (!userId) {
    return false;
  }

  return isFreshEntry(todayCache.get(userId));
}

export function cacheTodayView(userId: string, today: TodayViewData) {
  cacheValue(todayCache, userId, today);
  schedulePersistedPatientViewCache(userId);
}

export function clearCachedTodayView(userId?: string | null) {
  clearCacheKey(todayCache, userId);
  if (userId) {
    schedulePersistedPatientViewCache(userId);
  }
}

export function readCachedRecordDayView(
  userId?: string | null,
  isoDate?: string | null,
) {
  if (!userId || !isoDate) {
    return null;
  }

  return readCacheValue(
    recordDayCache,
    createRecordDayCacheKey(userId, isoDate),
  );
}

export function readCachedRecentChats(userId?: string | null) {
  return readCacheValue(recentChatsCache, userId);
}

export function hasFreshCachedRecentChats(userId?: string | null) {
  if (!userId) {
    return false;
  }

  return isFreshEntry(recentChatsCache.get(userId));
}

export function cacheRecentChats(
  userId: string,
  recentChats: RecentChatSummary[],
) {
  cacheValue(recentChatsCache, userId, recentChats);
  schedulePersistedPatientViewCache(userId);
}

export function clearCachedRecentChats(userId?: string | null) {
  clearCacheKey(recentChatsCache, userId);
  if (userId) {
    schedulePersistedPatientViewCache(userId);
  }
}

export function readCachedChatSession(
  userId?: string | null,
  sessionId?: string | null,
) {
  if (!userId || !sessionId) {
    return null;
  }

  return readCacheValue(
    chatSessionCache,
    createChatSessionCacheKey(userId, sessionId),
  );
}

export function hasFreshCachedChatSession(
  userId?: string | null,
  sessionId?: string | null,
) {
  if (!userId || !sessionId) {
    return false;
  }

  return isFreshEntry(
    chatSessionCache.get(createChatSessionCacheKey(userId, sessionId)),
  );
}

export function cacheChatSession(
  userId: string,
  sessionId: string,
  session: ChatSession,
) {
  cacheValue(
    chatSessionCache,
    createChatSessionCacheKey(userId, sessionId),
    session,
  );
}

export function clearCachedChatSession(
  userId?: string | null,
  sessionId?: string | null,
) {
  if (!userId || !sessionId) {
    return;
  }

  clearCacheKey(chatSessionCache, createChatSessionCacheKey(userId, sessionId));
}

export function hasFreshCachedRecordDayView(
  userId?: string | null,
  isoDate?: string | null,
) {
  if (!userId || !isoDate) {
    return false;
  }

  return isFreshEntry(
    recordDayCache.get(createRecordDayCacheKey(userId, isoDate)),
  );
}

export function cacheRecordDayView(
  userId: string,
  isoDate: string,
  recordDay: RecordDayView,
) {
  cacheValue(
    recordDayCache,
    createRecordDayCacheKey(userId, isoDate),
    recordDay,
  );
  schedulePersistedPatientViewCache(userId);
}

export function clearCachedRecordDayView(
  userId?: string | null,
  isoDate?: string | null,
) {
  if (!userId || !isoDate) {
    return;
  }

  clearCacheKey(recordDayCache, createRecordDayCacheKey(userId, isoDate));
  schedulePersistedPatientViewCache(userId);
}

export function clearPatientViewCaches(userId?: string | null) {
  clearMemoryPatientViewCaches(userId);
}

export const patientViewCacheTtlMs = VIEW_CACHE_TTL_MS;
