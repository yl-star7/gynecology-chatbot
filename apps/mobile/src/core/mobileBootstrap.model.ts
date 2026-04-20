import type { AuthenticatedUser } from "@gynecology-chatbot/app-core";
import type { MobileServices } from "./createMobileServices";

type BootstrapServices = Pick<
  MobileServices,
  "chatPort" | "homePort" | "knowledgePort" | "profilePort" | "todayPort"
>;

export function createTodayIsoDate(now = new Date()) {
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

export async function preloadPatientAppData({
  currentUser,
  services,
  todayIsoDate = createTodayIsoDate(),
}: {
  currentUser: Pick<AuthenticatedUser, "hasCompletedOnboarding" | "id"> | null;
  services: BootstrapServices;
  todayIsoDate?: string;
}) {
  if (!currentUser?.hasCompletedOnboarding) {
    return;
  }

  void Promise.allSettled([
    services.homePort.getRecordDay(todayIsoDate),
    services.chatPort.listRecentChats(),
    services.knowledgePort.listPregnancyWeeks(),
  ]);

  await Promise.allSettled([
    services.profilePort.getProfile(),
    services.homePort.getHomeView(),
    services.todayPort.getTodayView(),
  ]);
}
