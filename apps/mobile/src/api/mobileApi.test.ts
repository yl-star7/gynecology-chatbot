import assert from "node:assert/strict";
import test from "node:test";
import type {
  AuthenticatedUser,
  MobileProfileViewData,
} from "@gynecology-chatbot/app-core";
import { createMobileApiClient } from "./mobileApi";

const profilePayload: MobileProfileViewData = {
  userId: "user-1",
  displayName: "김수연",
  phoneNumber: "01012345678",
  pregnancyWeekLabel: "18주 2일",
  pregnancyDayCount: 128,
  accountStatus: "active",
  hasCompletedOnboarding: true,
  dueDate: "2026-08-01",
  tonePreference: "calm",
  babyNickname: "튼튼이",
  hospitalName: "산단여성병원",
  notificationTime: "08:30",
  themeKey: "rose-sand",
};

const updatedUser: AuthenticatedUser = {
  id: "user-1",
  displayName: "김수연",
  phoneNumber: "01012345678",
  hasCompletedOnboarding: true,
};

test("fetchMobileProfile targets the mobile profile endpoint with the resolved user id", async () => {
  const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
  const client = createMobileApiClient({
    getApiBaseUrl: () => "http://example.com",
    getUserId: () => "user-1",
    fetchImpl: async (input, init) => {
      calls.push({ input, init });
      return Response.json({ profile: profilePayload });
    },
  });

  const response = await client.fetchMobileProfile();

  assert.equal(
    calls[0]?.input,
    "http://example.com/api/mobile/profile?userId=user-1",
  );
  assert.equal(response.profile.displayName, "김수연");
});

test("updateMobileProfile uses PATCH and forwards the editable fields", async () => {
  const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
  const client = createMobileApiClient({
    getApiBaseUrl: () => "http://example.com",
    getUserId: () => "user-1",
    fetchImpl: async (input, init) => {
      calls.push({ input, init });
      return Response.json({ user: updatedUser });
    },
  });

  const response = await client.updateMobileProfile({
    userId: "user-1",
    displayName: "김수연",
    dueDate: "2026-08-01",
    tonePreference: "calm",
    babyNickname: "튼튼이",
    hospitalName: "산단여성병원",
    notificationTime: "08:30",
    themeKey: "rose-sand",
  });

  assert.equal(calls[0]?.input, "http://example.com/api/mobile/profile");
  assert.equal(calls[0]?.init?.method, "PATCH");
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
    userId: "user-1",
    displayName: "김수연",
    dueDate: "2026-08-01",
    tonePreference: "calm",
    babyNickname: "튼튼이",
    hospitalName: "산단여성병원",
    notificationTime: "08:30",
    themeKey: "rose-sand",
  });
  assert.equal(response.user.id, "user-1");
});
