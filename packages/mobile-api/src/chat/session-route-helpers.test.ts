var mockedDbSelect: jest.Mock;

jest.mock("../db/admin-client", () => {
  mockedDbSelect = jest.fn();
  return {
    dbSelect: mockedDbSelect,
  };
});

import {
  loadMobileChatSession,
  loadMobileChatSessions,
} from "./session-route-helpers";

describe("session-route-helpers", () => {
  beforeEach(() => {
    mockedDbSelect.mockReset();
  });

  it("uses the session summary before the latest raw message in the session list", async () => {
    mockedDbSelect.mockImplementation(async (path: string) => {
      if (path.startsWith("chat_sessions?select=id,title,last_message_at")) {
        return [
          {
            id: "session-1",
            title: "오늘 상담",
            last_message_at: "2026-05-07T10:00:00.000Z",
          },
        ];
      }

      if (path.startsWith("chat_messages?select=session_id,plain_text,parts")) {
        return [
          {
            session_id: "session-1",
            plain_text: "마지막 원문 메시지",
            parts: null,
          },
        ];
      }

      if (path.startsWith("calendar_logs?select=session_id,summary")) {
        return [
          {
            session_id: "session-1",
            summary: "요통 걱정을 나누고 쉬는 자세를 안내받았어요.",
          },
        ];
      }

      throw new Error(`unexpected path: ${path}`);
    });

    const sessions = await loadMobileChatSessions("user-1");

    expect(sessions).toEqual([
      expect.objectContaining({
        id: "session-1",
        title: "오늘 상담",
        preview: "요통 걱정을 나누고 쉬는 자세를 안내받았어요.",
      }),
    ]);
  });

  it("loads a session detail from the same data boundary as record-day views", async () => {
    mockedDbSelect.mockImplementation(async (path: string) => {
      if (path.startsWith("chat_sessions?select=id,title,last_message_at")) {
        return [
          {
            id: "local-session-welcome",
            title: "24주차 컨디션 채팅",
            last_message_at: "2026-05-07T10:00:00.000Z",
          },
        ];
      }

      if (path.startsWith("chat_messages?select=id,role,parts,created_at")) {
        return [
          {
            id: "message-1",
            role: "assistant",
            parts: [{ type: "text", id: "part-1", text: "안녕하세요." }],
            created_at: "2026-05-07T10:00:00.000Z",
          },
        ];
      }

      throw new Error(`unexpected path: ${path}`);
    });

    const session = await loadMobileChatSession(
      "user-1",
      "local-session-welcome",
    );

    expect(session).toEqual(
      expect.objectContaining({
        id: "local-session-welcome",
        title: "24주차 컨디션 채팅",
        messages: [
          expect.objectContaining({
            id: "message-1",
            role: "assistant",
            parts: [{ type: "text", id: "part-1", text: "안녕하세요." }],
          }),
        ],
      }),
    );
  });

  it("returns null without reading messages when the session is outside the user", async () => {
    mockedDbSelect.mockResolvedValueOnce([]);

    const session = await loadMobileChatSession("user-1", "missing-session");

    expect(session).toBeNull();
    expect(mockedDbSelect).toHaveBeenCalledTimes(1);
  });
});
