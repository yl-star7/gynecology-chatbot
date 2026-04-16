import type {
  ChatSession,
  HomeViewData,
  MobileProfileViewData,
  RecentChatSummary,
  RecordDayView,
  TodayViewData,
} from "@gynecology-chatbot/app-core";

const VIEW_CACHE_TTL_MS = 60 * 1000;

type CacheEntry<T> = {
  value: T;
  updatedAt: number;
};

const profileCache = new Map<string, CacheEntry<MobileProfileViewData>>();
const homeCache = new Map<string, CacheEntry<HomeViewData>>();
const todayCache = new Map<string, CacheEntry<TodayViewData>>();
const recordDayCache = new Map<string, CacheEntry<RecordDayView>>();
const recentChatsCache = new Map<string, CacheEntry<RecentChatSummary[]>>();
const chatSessionCache = new Map<string, CacheEntry<ChatSession>>();

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
}

export function clearCachedProfileView(userId?: string | null) {
  clearCacheKey(profileCache, userId);
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
}

export function clearCachedHomeView(userId?: string | null) {
  clearCacheKey(homeCache, userId);
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
}

export function clearCachedTodayView(userId?: string | null) {
  clearCacheKey(todayCache, userId);
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
}

export function clearCachedRecentChats(userId?: string | null) {
  clearCacheKey(recentChatsCache, userId);
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
}

export function clearCachedRecordDayView(
  userId?: string | null,
  isoDate?: string | null,
) {
  if (!userId || !isoDate) {
    return;
  }

  clearCacheKey(recordDayCache, createRecordDayCacheKey(userId, isoDate));
}

export function clearPatientViewCaches(userId?: string | null) {
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

export const patientViewCacheTtlMs = VIEW_CACHE_TTL_MS;
