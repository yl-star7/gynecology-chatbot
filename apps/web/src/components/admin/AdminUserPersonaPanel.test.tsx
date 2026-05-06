import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AdminUserPersonaPanel } from "./AdminUserPersonaPanel";

type FetchMock = jest.Mock<
  Promise<Response>,
  [input: string | URL | Request, init?: RequestInit]
>;

function jsonResponse(payload: unknown, init?: ResponseInit) {
  return Promise.resolve(
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
      ...init,
    }),
  );
}

describe("AdminUserPersonaPanel", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("loads the selected user's persona profile and recent signals", async () => {
    const fetchMock: FetchMock = jest.fn<
      Promise<Response>,
      [input: string | URL | Request, init?: RequestInit]
    >(() =>
      jsonResponse({
        profile: {
          userId: "user-1",
          personaHint: "practical",
          confidence: "medium",
          evidenceSummary: "태동 기준을 구체적으로 질문함",
          weightedScore: 2,
          lastObservedAt: "2026-05-06T10:00:00.000Z",
        },
        signals: [
          {
            id: "signal-1",
            userId: "user-1",
            sessionId: null,
            sourceMessageId: null,
            personaHint: "practical",
            confidence: "medium",
            evidence: "최근 검사 기준과 태동 횟수를 질문함",
            weight: 2,
            observedAt: "2026-05-06T10:00:00.000Z",
            createdAt: "2026-05-06T10:00:00.000Z",
          },
        ],
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<AdminUserPersonaPanel userId="user-1" />);

    expect(await screen.findByText("태동 기준을 구체적으로 질문함"))
      .toBeInTheDocument();
    expect(
      screen.getByText("최근 검사 기준과 태동 횟수를 질문함"),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/users/persona?userId=user-1",
    );
  });

  it("writes a manual persona signal and refreshes the profile", async () => {
    const fetchMock: FetchMock = jest
      .fn<Promise<Response>, [input: string | URL | Request, init?: RequestInit]>()
      .mockImplementationOnce(() =>
        jsonResponse({
          profile: null,
          signals: [],
        }),
      )
      .mockImplementationOnce((_input, init) =>
        jsonResponse({
          signal: {
            id: "signal-2",
            userId: "user-1",
            sessionId: null,
            sourceMessageId: null,
            personaHint: "practical",
            confidence: "medium",
            evidence: JSON.parse(String(init?.body)).evidence,
            weight: 2,
            observedAt: "2026-05-06T11:00:00.000Z",
            createdAt: "2026-05-06T11:00:00.000Z",
          },
        }),
      )
      .mockImplementationOnce(() =>
        jsonResponse({
          profile: {
            userId: "user-1",
            personaHint: "practical",
            confidence: "medium",
            evidenceSummary: "기준과 수치를 반복해서 확인함",
            weightedScore: 2,
            lastObservedAt: "2026-05-06T11:00:00.000Z",
          },
          signals: [],
        }),
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<AdminUserPersonaPanel userId="user-1" />);

    await screen.findByText("아직 저장된 성향 신호가 없습니다.");
    fireEvent.change(screen.getByLabelText("운영자 근거"), {
      target: { value: "기준과 수치를 반복해서 확인함" },
    });
    fireEvent.click(screen.getByRole("button", { name: "성향 신호 추가" }));

    expect(await screen.findByText("상담 성향 신호를 추가했습니다."))
      .toBeInTheDocument();
    expect(
      await screen.findByText("기준과 수치를 반복해서 확인함"),
    ).toBeInTheDocument();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/admin/users/persona",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          userId: "user-1",
          personaHint: "practical",
          confidence: "medium",
          evidence: "기준과 수치를 반복해서 확인함",
        }),
      }),
    );
  });
});
