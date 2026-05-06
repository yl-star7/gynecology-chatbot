import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AdminOperationsPanel } from "./AdminOperationsPanel";

const externalSurveys = [
  {
    id: "survey-1",
    label: "1차 설문지",
    url: "https://forms.gle/ZoLxWPdwid1F94FE8",
    visible: true,
  },
  {
    id: "survey-2",
    label: "2차 설문지",
    url: "https://forms.gle/LvFmEZHkGM3MMLQ8A",
    visible: true,
  },
  {
    id: "survey-3",
    label: "3차 설문지",
    url: "https://forms.gle/fNUX6qDjXR5wXoGt7",
    visible: true,
  },
];

describe("AdminOperationsPanel", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url === "/api/admin/rag-provider" && !init?.method) {
          return new Response(JSON.stringify({ ragProvider: "schift" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (url === "/api/admin/schedule" && !init?.method) {
          return new Response(
            JSON.stringify({
              dailyCheckEnabled: false,
              dailyCheckTime: "09:00",
              weeklyMilestoneEnabled: false,
              weeklyMilestoneTime: "10:00",
              weeklyMilestoneDay: 1,
              checkupReminderEnabled: false,
              checkupReminderTime: "08:00",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        if (url === "/api/admin/schedule" && init?.method === "PUT") {
          return new Response(
            JSON.stringify({
              ok: true,
              schedule: JSON.parse(String(init.body)),
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        if (
          url === "/api/admin/workflow-rules/stage-mapping" &&
          !init?.method
        ) {
          return new Response(
            JSON.stringify({
              mapping: {
                router: "wf-router",
                baby_info: "wf-baby",
                letter_reflection: "wf-letter",
                free_chat: "wf-free",
                general: "wf-general",
              },
              source: "db",
              updatedAt: "2026-05-06T00:00:00.000Z",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        if (
          url === "/api/admin/workflow-rules/stage-mapping" &&
          init?.method === "PUT"
        ) {
          return new Response(
            JSON.stringify({
              ok: true,
              mapping: JSON.parse(String(init.body)),
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        if (
          url === "/api/admin/workflow-rules/refresh-yaml" &&
          init?.method === "POST"
        ) {
          return new Response(
            JSON.stringify({
              name: "모성간호 상담 응답",
              blockCount: 4,
              refreshedAt: "2026-05-06T00:00:00.000Z",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        if (url === "/api/admin/push/send" && init?.method === "POST") {
          return new Response(JSON.stringify({ sent: 3, skipped: 1 }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (
          url === "/api/admin/proactive/trigger" &&
          init?.method === "POST"
        ) {
          return new Response(JSON.stringify({ triggerId: "daily_check" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (url === "/api/admin/approval-policy" && !init?.method) {
          return new Response(JSON.stringify({ requireApproval: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (url === "/api/admin/approval-policy" && init?.method === "PUT") {
          const body = JSON.parse(String(init.body));
          return new Response(
            JSON.stringify({ ok: true, requireApproval: body.requireApproval }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        if (url === "/api/admin/branding" && !init?.method) {
          return new Response(
            JSON.stringify({
              mascotBucketId: null,
              mascotObjectPath: null,
              mascotSourceFileName: null,
              mascotAltText: "마스코트",
              surveyFormUrl: null,
              externalSurveys,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        if (url === "/api/admin/branding/character-images" && !init?.method) {
          return new Response(
            JSON.stringify({
              version: "v1",
              images: {
                neutral:
                  "https://storage.googleapis.com/pregnancy-content/assets/penguin-nurse/app/neutral.png",
                calm: "https://storage.googleapis.com/pregnancy-content/assets/penguin-nurse/app/calm.png",
                joyful:
                  "https://storage.googleapis.com/pregnancy-content/assets/penguin-nurse/app/joyful.png",
                anxious:
                  "https://storage.googleapis.com/pregnancy-content/assets/penguin-nurse/app/anxious.png",
                tired:
                  "https://storage.googleapis.com/pregnancy-content/assets/penguin-nurse/app/tired.png",
                sad: "https://storage.googleapis.com/pregnancy-content/assets/penguin-nurse/app/sad.png",
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        if (
          url === "/api/admin/content/media/upload" &&
          init?.method === "POST"
        ) {
          return new Response(
            JSON.stringify({
              ok: true,
              bucketId: "pregnancy-content",
              objectPath: "weeks/00/123-mascot.png",
              sourceFileName: "mascot.png",
              signedUrl: "https://upload.example.test/signed",
              contentType: "image/png",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        if (
          url === "https://upload.example.test/signed" &&
          init?.method === "PUT"
        ) {
          return new Response(null, { status: 200 });
        }

        if (url === "/api/admin/branding" && init?.method === "PUT") {
          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (
          url === "/api/admin/branding/character-images" &&
          init?.method === "PUT"
        ) {
          const body = JSON.parse(String(init.body));
          return new Response(
            JSON.stringify({
              ok: true,
              config: {
                version: "v2",
                images: body.images,
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        if (url === "/api/admin/schift" && !init?.method) {
          return new Response(
            JSON.stringify({
              collections: [
                {
                  id: "col1",
                  name: "pregnancy-knowledge",
                  vector_count: 759,
                  model: "schift-embed-1",
                  dimension: 1024,
                },
              ],
              workflows: [
                {
                  id: "wf1",
                  name: "내부 데이터 응답",
                  description: "임신 지식 RAG",
                  status: "published",
                  block_count: 5,
                  updated_at: "2026-03-26T02:25:59Z",
                },
              ],
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        throw new Error(`Unexpected fetch: ${url}`);
      },
    ) as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("shows plain language controls for app approval policy", async () => {
    render(<AdminOperationsPanel />);

    expect(
      await screen.findByText("현재 모드: 관리자 확인 후 사용"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "새 가입자는 사용자 관리 화면에서 승인해야 앱을 사용할 수 있습니다.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "가입하면 바로 사용" }));

    await waitFor(() => {
      expect(
        screen.getByText("현재 모드: 가입하면 바로 사용"),
      ).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/approval-policy",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ requireApproval: false }),
      }),
    );
  });

  it("saves notification schedule controls", async () => {
    render(<AdminOperationsPanel />);

    const dailyTimeInput = await screen.findByLabelText("매일 확인 알림 시각");
    fireEvent.change(dailyTimeInput, { target: { value: "08:30" } });
    fireEvent.click(screen.getByRole("button", { name: "스케줄 저장" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/schedule",
        expect.objectContaining({
          method: "PUT",
          body: expect.stringContaining('"dailyCheckTime":"08:30"'),
        }),
      );
    });
    expect(
      await screen.findByText("알림 스케줄을 저장했습니다."),
    ).toBeInTheDocument();
  });

  it("runs manual operations from admin controls", async () => {
    render(<AdminOperationsPanel />);

    fireEvent.click(
      await screen.findByRole("button", { name: /YAML 캐시 새로고침/ }),
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/workflow-rules/refresh-yaml",
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(await screen.findByText(/모성간호 상담 응답/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /푸시 수동 발송/ }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/push/send",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("saves stage workflow mapping as JSON", async () => {
    render(<AdminOperationsPanel />);

    const mappingInput = await screen.findByLabelText(
      "stage 워크플로우 매핑 JSON",
    );
    fireEvent.change(mappingInput, {
      target: {
        value: JSON.stringify({
          router: "wf-router-2",
          baby_info: "wf-baby",
          letter_reflection: "wf-letter",
          free_chat: "wf-free",
          general: "wf-general",
        }),
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "매핑 저장" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/workflow-rules/stage-mapping",
        expect.objectContaining({
          method: "PUT",
          body: expect.stringContaining("wf-router-2"),
        }),
      );
    });
    expect(
      await screen.findByText("워크플로우 매핑을 저장했습니다."),
    ).toBeInTheDocument();
  });

  it("uploads mascot files through signed URLs before saving branding", async () => {
    render(<AdminOperationsPanel />);

    const input = await screen.findByLabelText("마스코트 업로드");
    const file = new File(["image"], "mascot.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "https://upload.example.test/signed",
        expect.objectContaining({
          method: "PUT",
          body: file,
        }),
      );
    });

    const brandingSaveCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url, init]) => url === "/api/admin/branding" && init?.method === "PUT",
    );
    expect(brandingSaveCall).toBeTruthy();
    expect(JSON.parse(String(brandingSaveCall?.[1]?.body))).toEqual({
      mascotBucketId: "pregnancy-content",
      mascotObjectPath: "weeks/00/123-mascot.png",
      mascotSourceFileName: "mascot.png",
      mascotAltText: "마스코트",
      surveyFormUrl: "https://forms.gle/ZoLxWPdwid1F94FE8",
      externalSurveys,
    });
  });

  it("saves the survey form url through branding settings", async () => {
    render(<AdminOperationsPanel />);

    const input = await screen.findByLabelText("설문 링크");
    fireEvent.change(input, {
      target: { value: "https://docs.google.com/forms/d/e/example/viewform" },
    });

    fireEvent.click(screen.getByRole("button", { name: "설문 링크 저장" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/branding",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({
            mascotBucketId: null,
            mascotObjectPath: null,
            mascotSourceFileName: null,
            mascotAltText: "마스코트",
            surveyFormUrl: "https://docs.google.com/forms/d/e/example/viewform",
            externalSurveys,
          }),
        }),
      );
    });
  });

  it("saves survey visibility changes through branding settings", async () => {
    render(<AdminOperationsPanel />);

    const survey2Visible = await screen.findByLabelText("2차 설문지 보임");
    fireEvent.click(survey2Visible);
    fireEvent.click(screen.getByRole("button", { name: "설문 링크 저장" }));

    await waitFor(() => {
      const brandingSaveCall = (global.fetch as jest.Mock).mock.calls.find(
        ([url, init]) =>
          url === "/api/admin/branding" && init?.method === "PUT",
      );
      expect(brandingSaveCall).toBeTruthy();
      expect(JSON.parse(String(brandingSaveCall?.[1]?.body))).toEqual({
        mascotBucketId: null,
        mascotObjectPath: null,
        mascotSourceFileName: null,
        mascotAltText: "마스코트",
        surveyFormUrl: "https://forms.gle/ZoLxWPdwid1F94FE8",
        externalSurveys: [
          externalSurveys[0],
          { ...externalSurveys[1], visible: false },
          externalSurveys[2],
        ],
      });
    });
  });

  it("uploads a nurse character tone into the shared image cache", async () => {
    render(<AdminOperationsPanel />);

    const input = await screen.findByLabelText("차분 이미지");
    const file = new File(["image"], "calm.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "https://upload.example.test/signed",
        expect.objectContaining({
          method: "PUT",
          body: file,
        }),
      );
    });

    const uploadCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url, init]) =>
        url === "/api/admin/content/media/upload" && init?.method === "POST",
    );
    const formData = uploadCall?.[1]?.body as FormData;
    expect(formData.get("mediaScope")).toBe("asset");
    expect(formData.get("objectPath")).toBe(
      "assets/penguin-nurse/app/calm.png",
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/branding/character-images",
      expect.objectContaining({
        method: "PUT",
        body: expect.stringContaining(
          "https://storage.googleapis.com/pregnancy-content/weeks/00/123-mascot.png",
        ),
      }),
    );
  });
});
