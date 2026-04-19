import assert from "node:assert/strict";
import test from "node:test";
import { preloadPatientAppData } from "./mobileBootstrap.model.ts";

function createServices(calls: string[], rejectHome = false) {
  return {
    profilePort: {
      getProfile: async () => {
        calls.push("profile");
      },
    },
    homePort: {
      getHomeView: async () => {
        calls.push("home");
        if (rejectHome) {
          throw new Error("home failed");
        }
      },
      getRecordDay: async (isoDate: string) => {
        calls.push(`record:${isoDate}`);
      },
    },
    todayPort: {
      getTodayView: async () => {
        calls.push("today");
      },
    },
    chatPort: {
      listRecentChats: async () => {
        calls.push("recent-chats");
      },
    },
    knowledgePort: {
      listPregnancyWeeks: async () => {
        calls.push("pregnancy-weeks");
      },
    },
  };
}

test("preloadPatientAppData skips guest and onboarding users", async () => {
  const calls: string[] = [];
  const services = createServices(calls);

  await preloadPatientAppData({
    currentUser: null,
    services,
    todayIsoDate: "2026-04-18",
  });
  await preloadPatientAppData({
    currentUser: {
      id: "user-1",
      hasCompletedOnboarding: false,
    },
    services,
    todayIsoDate: "2026-04-18",
  });

  assert.deepEqual(calls, []);
});

test("preloadPatientAppData warms patient screen data before the app opens", async () => {
  const calls: string[] = [];

  await preloadPatientAppData({
    currentUser: {
      id: "user-1",
      hasCompletedOnboarding: true,
    },
    services: createServices(calls),
    todayIsoDate: "2026-04-18",
  });

  assert.deepEqual(calls.sort(), [
    "home",
    "pregnancy-weeks",
    "profile",
    "recent-chats",
    "record:2026-04-18",
    "today",
  ]);
});

test("preloadPatientAppData waits for every preload attempt even if one fails", async () => {
  const calls: string[] = [];

  await preloadPatientAppData({
    currentUser: {
      id: "user-1",
      hasCompletedOnboarding: true,
    },
    services: createServices(calls, true),
    todayIsoDate: "2026-04-18",
  });

  assert.deepEqual(calls.sort(), [
    "home",
    "pregnancy-weeks",
    "profile",
    "recent-chats",
    "record:2026-04-18",
    "today",
  ]);
});
