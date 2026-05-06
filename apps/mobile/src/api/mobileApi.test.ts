import assert from "node:assert/strict";
import test from "node:test";
import type {
  AuthenticatedUser,
  MobilePregnancyWeekSummary,
  MobileProfileViewData,
  RecordDayView,
  TodayViewData,
} from "@gynecology-chatbot/app-core";
import * as nativeSessionStorage from "../core/nativeSessionStorage.ts";
import {
  createMobileApiClient,
  SessionExpiredError,
  RateLimitError,
  setMobileSessionExpiredHandler,
  storeCurrentMobileSessionToken,
  storeCurrentMobileUserId,
} from "./mobileApi.ts";

test.beforeEach(() => {
  storeCurrentMobileSessionToken(null);
  storeCurrentMobileUserId(null);
  setMobileSessionExpiredHandler(null);
});

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

const recordDayPayload: RecordDayView = {
  isoDate: "2026-03-18",
  dateLabel: "2026년 3월 18일 수요일",
  infoViewed: true,
  emotionTone: "calm",
  checklistItems: [
    { id: "check-1", label: "엽산 보충제 섭취하기", completed: true },
  ],
  conversationSummary: "1개의 대화가 있었어요.",
  dailyQuestion: {
    question: "오늘 가장 기억에 남는 순간은 무엇이었나요?",
    answer: "아기가 움직이는 느낌이 선명했어요.",
    aiSummary: "아기의 움직임을 느끼며 안심한 하루였어요.",
  },
  records: [],
  relatedSessions: [],
};

const todayPayload: TodayViewData = {
  babyBody: "아기가 자라고 있어요.",
  momBody: "몸의 변화가 시작되고 있어요.",
  infoViewed: false,
  checklistItems: [{ id: "water", label: "물 마시기", completed: false }],
};

const pregnancyWeeksPayload: MobilePregnancyWeekSummary[] = [
  {
    weekNumber: 18,
    title: "18주차",
    babySizeLabel: "고구마",
    babySummary: "아기가 활발히 움직여요.",
    motherSummary: "배가 조금씩 더 도드라져요.",
  },
];

test("fetchMobileProfile targets the mobile profile endpoint with the resolved user id", async () => {
  const calls: { input: RequestInfo | URL; init?: RequestInit }[] = [];
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

test("fetchHome forwards the requested calendar month", async () => {
  const calls: { input: RequestInfo | URL; init?: RequestInit }[] = [];
  const client = createMobileApiClient({
    getApiBaseUrl: () => "http://example.com",
    getUserId: () => "user-1",
    fetchImpl: async (input, init) => {
      calls.push({ input, init });
      return Response.json({
        home: {
          userName: "수연",
          pregnancyDayCount: 132,
          pregnancyWeekLabel: "18주 6일",
          currentMonthLabel: "2026년 4월",
          calendarDays: [],
          notebookCard: {
            id: "notebook",
            title: "임신수첩",
            description: "기록을 정리해요.",
            href: "/records",
          },
          knowledgeCard: {
            id: "knowledge",
            title: "임신 지식",
            description: "주차별 정보를 읽어요.",
            href: "/knowledge",
          },
        },
      });
    },
  });

  const response = await client.fetchHome("2026-04");

  assert.equal(
    calls[0]?.input,
    "http://example.com/api/mobile/home?userId=user-1&month=2026-04",
  );
  assert.equal(response.home.currentMonthLabel, "2026년 4월");
});

test("fetchHome omits the month query when the current month is requested", async () => {
  const calls: { input: RequestInfo | URL; init?: RequestInit }[] = [];
  const client = createMobileApiClient({
    getApiBaseUrl: () => "http://example.com",
    getUserId: () => "user-1",
    fetchImpl: async (input, init) => {
      calls.push({ input, init });
      return Response.json({
        home: {
          userName: "수연",
          pregnancyDayCount: 132,
          pregnancyWeekLabel: "18주 6일",
          currentMonthLabel: "2026년 5월",
          calendarDays: [],
          notebookCard: {
            id: "notebook",
            title: "임신수첩",
            description: "기록을 정리해요.",
            href: "/records",
          },
          knowledgeCard: {
            id: "knowledge",
            title: "임신 지식",
            description: "주차별 정보를 읽어요.",
            href: "/knowledge",
          },
        },
      });
    },
  });

  await client.fetchHome();

  assert.equal(
    calls[0]?.input,
    "http://example.com/api/mobile/home?userId=user-1",
  );
});

test("updateMobileProfile uses PATCH and forwards the editable fields", async () => {
  const calls: { input: RequestInfo | URL; init?: RequestInit }[] = [];
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
    notificationTime: "06:07",
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
    notificationTime: "06:07",
    themeKey: "rose-sand",
  });
  assert.equal(response.user.id, "user-1");
});

test("submitProfileSurveyAnswer posts the selected answer to the profile survey endpoint", async () => {
  const calls: { input: RequestInfo | URL; init?: RequestInit }[] = [];
  const client = createMobileApiClient({
    getApiBaseUrl: () => "http://example.com",
    getUserId: () => "user-1",
    fetchImpl: async (input, init) => {
      calls.push({ input, init });
      return Response.json({ ok: true });
    },
  });

  const response = await client.submitProfileSurveyAnswer({
    userId: "user-1",
    questionId: "question-1",
    answer: "네",
  });

  assert.equal(
    calls[0]?.input,
    "http://example.com/api/mobile/profile/surveys",
  );
  assert.equal(calls[0]?.init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
    userId: "user-1",
    questionId: "question-1",
    answer: "네",
  });
  assert.equal(response.ok, true);
});

test("fetchRecordDay targets the mobile records endpoint with the selected date", async () => {
  const calls: { input: RequestInfo | URL; init?: RequestInit }[] = [];
  const client = createMobileApiClient({
    getApiBaseUrl: () => "http://example.com",
    getUserId: () => "user-1",
    fetchImpl: async (input, init) => {
      calls.push({ input, init });
      return Response.json({ recordDay: recordDayPayload });
    },
  });

  const response = await client.fetchRecordDay("2026-03-18");

  assert.equal(
    calls[0]?.input,
    "http://example.com/api/mobile/records?userId=user-1&date=2026-03-18",
  );
  assert.equal(response.recordDay.isoDate, "2026-03-18");
});

test("fetchTodayView targets the mobile today endpoint with the resolved user id", async () => {
  const calls: { input: RequestInfo | URL; init?: RequestInit }[] = [];
  const client = createMobileApiClient({
    getApiBaseUrl: () => "http://example.com",
    getUserId: () => "user-1",
    fetchImpl: async (input, init) => {
      calls.push({ input, init });
      return Response.json({ today: todayPayload });
    },
  });

  const response = await client.fetchTodayView();

  assert.equal(
    calls[0]?.input,
    "http://example.com/api/mobile/today?userId=user-1",
  );
  assert.equal(response.today.checklistItems[0]?.label, "물 마시기");
});

test("fetchPregnancyWeeks targets the mobile weeks endpoint", async () => {
  const calls: { input: RequestInfo | URL; init?: RequestInit }[] = [];
  const client = createMobileApiClient({
    getApiBaseUrl: () => "http://example.com",
    getUserId: () => "user-1",
    fetchImpl: async (input, init) => {
      calls.push({ input, init });
      return Response.json({ weeks: pregnancyWeeksPayload });
    },
  });

  const response = await client.fetchPregnancyWeeks();

  assert.equal(calls[0]?.input, "http://example.com/api/mobile/weeks");
  assert.equal(response.weeks[0]?.weekNumber, 18);
  assert.equal(response.weeks[0]?.babySizeLabel, "고구마");
});

test("updateTodayChecklistItem sends PATCH to the mobile today endpoint", async () => {
  const calls: { input: RequestInfo | URL; init?: RequestInit }[] = [];
  const client = createMobileApiClient({
    getApiBaseUrl: () => "http://example.com",
    getUserId: () => "user-1",
    fetchImpl: async (input, init) => {
      calls.push({ input, init });
      return Response.json({ ok: true });
    },
  });

  const response = await client.updateTodayChecklistItem({
    checklistId: "check-1",
    completed: true,
  });

  assert.equal(calls[0]?.input, "http://example.com/api/mobile/today");
  assert.equal(calls[0]?.init?.method, "PATCH");
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
    userId: "user-1",
    checklistId: "check-1",
    completed: true,
  });
  assert.equal(response.ok, true);
});

test("401 응답 시 SessionExpiredError를 throw한다", async () => {
  let notified = false;
  setMobileSessionExpiredHandler(() => {
    notified = true;
  });
  const client = createMobileApiClient({
    getApiBaseUrl: () => "http://example.com",
    getUserId: () => "user-1",
    fetchImpl: async () => {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
      });
    },
  });

  await assert.rejects(
    () => client.fetchTodayView(),
    (err: unknown) => {
      assert.ok(
        err instanceof SessionExpiredError,
        "SessionExpiredError여야 한다",
      );
      assert.ok(err.message.includes("세션이 만료"), `메시지: ${err.message}`);
      return true;
    },
  );
  assert.equal(notified, true);
});

test("429 응답 시 RateLimitError를 throw한다", async () => {
  const client = createMobileApiClient({
    getApiBaseUrl: () => "http://example.com",
    getUserId: () => "user-1",
    fetchImpl: async () => {
      return new Response(JSON.stringify({ error: "rate limit exceeded" }), {
        status: 429,
      });
    },
  });

  await assert.rejects(
    async () => {
      await client.fetchTodayView();
    },
    (err: unknown) => {
      assert.ok(err instanceof RateLimitError, "RateLimitError여야 한다");
      assert.ok(err.message.includes("잠시 후"), `메시지: ${err.message}`);
      return true;
    },
  );
});

test("markTodayInfoViewed sends PATCH action to the mobile today endpoint", async () => {
  const calls: { input: RequestInfo | URL; init?: RequestInit }[] = [];
  const client = createMobileApiClient({
    getApiBaseUrl: () => "http://example.com",
    getUserId: () => "user-1",
    fetchImpl: async (input, init) => {
      calls.push({ input, init });
      return Response.json({ ok: true });
    },
  });

  const response = await client.markTodayInfoViewed();

  assert.equal(calls[0]?.input, "http://example.com/api/mobile/today");
  assert.equal(calls[0]?.init?.method, "PATCH");
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
    userId: "user-1",
    action: "view_info",
  });
  assert.equal(response.ok, true);
});

test("sendChatMessage restores token and user id from native storage before sending", async () => {
  const readTokenMock = test.mock.method(
    nativeSessionStorage,
    "readNativeSessionToken",
    async () => "native-token",
  );
  const readUserIdMock = test.mock.method(
    nativeSessionStorage,
    "readNativeUserId",
    async () => "native-user",
  );
  const calls: { input: RequestInfo | URL; init?: RequestInit }[] = [];
  const client = createMobileApiClient({
    getApiBaseUrl: () => "http://example.com",
    fetchImpl: async (input, init) => {
      calls.push({ input, init });
      return Response.json({
        assistantMessage: {
          id: "assistant-1",
          role: "assistant",
          createdAtLabel: "방금 전",
          parts: [{ type: "text", id: "part-1", text: "안녕하세요" }],
        },
      });
    },
  });

  const response = await client.sendChatMessage({
    sessionId: "session-1",
    text: "안녕",
    selectedMoodTone: "sad",
    imageDataUris: [],
  });

  assert.equal(calls[0]?.input, "http://example.com/api/mobile/chat");
  assert.equal(
    (calls[0]?.init?.headers as Record<string, string>).Authorization,
    "Bearer native-token",
  );
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
    userId: "native-user",
    sessionId: "session-1",
    text: "안녕",
    selectedMoodTone: "sad",
    pregnancyWeek: undefined,
    imageDataUris: [],
  });
  assert.equal(response.assistantMessage.role, "assistant");

  readTokenMock.mock.restore();
  readUserIdMock.mock.restore();
});

test("fetchInitialConversationMessage restores token before requesting server workflow", async () => {
  const readTokenMock = test.mock.method(
    nativeSessionStorage,
    "readNativeSessionToken",
    async () => "native-token",
  );
  const readUserIdMock = test.mock.method(
    nativeSessionStorage,
    "readNativeUserId",
    async () => "native-user",
  );
  const calls: { input: RequestInfo | URL; init?: RequestInit }[] = [];
  const client = createMobileApiClient({
    getApiBaseUrl: () => "http://example.com",
    fetchImpl: async (input, init) => {
      calls.push({ input, init });
      return Response.json({
        message: {
          id: "assistant-initial-workflow",
          role: "assistant",
          createdAtLabel: "방금 전",
          parts: [
            {
              type: "text",
              id: "initial-workflow-text",
              text: "오늘은 마음이 어떠세요?",
            },
          ],
        },
      });
    },
  });

  const response = await client.fetchInitialConversationMessage();

  assert.equal(
    calls[0]?.input,
    "http://example.com/api/mobile/chat/initial-workflow",
  );
  assert.equal(
    (calls[0]?.init?.headers as Record<string, string>).Authorization,
    "Bearer native-token",
  );
  assert.equal(response.message.id, "assistant-initial-workflow");

  readTokenMock.mock.restore();
  readUserIdMock.mock.restore();
});
