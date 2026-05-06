import type { AuthenticatedUser } from "@gynecology-chatbot/app-core";
import { createKoreanDateKey } from "@gynecology-chatbot/app-core";
import type { MobileServices } from "./createMobileServices";

type BootstrapServices = Pick<
  MobileServices,
  "chatPort" | "homePort" | "knowledgePort" | "profilePort" | "todayPort"
>;

export type PatientPreloadCacheState = {
  hasFreshProfileView(userId: string): boolean;
  hasFreshHomeView(userId: string): boolean;
  hasFreshTodayView(userId: string): boolean;
  hasFreshPregnancyWeeks(userId: string): boolean;
  hasFreshRecentChats(userId: string): boolean;
  hasFreshRecordDayView(userId: string, isoDate: string): boolean;
};

const EMPTY_PATIENT_PRELOAD_CACHE_STATE: PatientPreloadCacheState = {
  hasFreshProfileView: () => false,
  hasFreshHomeView: () => false,
  hasFreshTodayView: () => false,
  hasFreshPregnancyWeeks: () => false,
  hasFreshRecentChats: () => false,
  hasFreshRecordDayView: () => false,
};

export function createTodayIsoDate(now = new Date()) {
  return createKoreanDateKey(now);
}

export function resolveUnauthenticatedRedirect({
  currentUser,
  isRestoringSession,
  routeSegments,
}: {
  currentUser: Pick<
    AuthenticatedUser,
    "accountStatus" | "hasCompletedOnboarding" | "id"
  > | null;
  isRestoringSession: boolean;
  routeSegments: readonly string[];
}) {
  if (isRestoringSession) {
    return null;
  }

  const [rootSegment] = routeSegments;

  if (!currentUser) {
    return rootSegment === "auth" ? null : "/auth/login";
  }

  if (
    currentUser.accountStatus === "pending_approval" &&
    rootSegment !== "approval-pending"
  ) {
    return "/approval-pending";
  }

  if (
    currentUser.accountStatus !== "pending_approval" &&
    !currentUser.hasCompletedOnboarding &&
    rootSegment !== "onboarding"
  ) {
    return "/onboarding";
  }

  if (rootSegment === "auth") {
    return currentUser.hasCompletedOnboarding ? "/(tabs)/home" : "/onboarding";
  }

  if (
    currentUser.accountStatus !== "pending_approval" &&
    currentUser.hasCompletedOnboarding &&
    (rootSegment === "approval-pending" || rootSegment === "onboarding")
  ) {
    return "/(tabs)/home";
  }

  if (
    currentUser.accountStatus === "pending_approval" ||
    !currentUser.hasCompletedOnboarding
  ) {
    return null;
  }

  return null;
}

export async function preloadPatientAppData({
  currentUser,
  services,
  cacheState = EMPTY_PATIENT_PRELOAD_CACHE_STATE,
  todayIsoDate = createTodayIsoDate(),
}: {
  currentUser: Pick<
    AuthenticatedUser,
    "accountStatus" | "hasCompletedOnboarding" | "id"
  > | null;
  services: BootstrapServices;
  cacheState?: PatientPreloadCacheState;
  todayIsoDate?: string;
}) {
  if (
    !currentUser?.hasCompletedOnboarding ||
    currentUser.accountStatus === "pending_approval"
  ) {
    return;
  }

  const userId = currentUser.id;
  const preloadTasks: Promise<unknown>[] = [];

  if (!cacheState.hasFreshProfileView(userId)) {
    preloadTasks.push(services.profilePort.getProfile());
  }

  if (!cacheState.hasFreshHomeView(userId)) {
    preloadTasks.push(services.homePort.getHomeView());
  }

  if (!cacheState.hasFreshTodayView(userId)) {
    preloadTasks.push(services.todayPort.getTodayView());
  }

  if (!cacheState.hasFreshPregnancyWeeks(userId)) {
    preloadTasks.push(services.knowledgePort.listPregnancyWeeks());
  }

  if (!cacheState.hasFreshRecentChats(userId)) {
    preloadTasks.push(services.chatPort.listRecentChats());
  }

  if (!cacheState.hasFreshRecordDayView(userId, todayIsoDate)) {
    preloadTasks.push(services.homePort.getRecordDay(todayIsoDate));
  }

  await Promise.allSettled(preloadTasks);
}
