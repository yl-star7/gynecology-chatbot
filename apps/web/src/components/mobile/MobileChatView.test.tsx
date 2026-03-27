import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import {
  createSessionId,
  fetchSession,
  fetchSessions,
  sendChatMessage,
} from "@/lib/mobile/web-mobile-api";
import { MobileChatView } from "./MobileChatView";

jest.mock("lucide-react", () => ({
  ArrowUp: (props: Record<string, unknown>) => <svg {...props} />,
  LoaderCircle: (props: Record<string, unknown>) => <svg {...props} />,
  Paperclip: (props: Record<string, unknown>) => <svg {...props} />,
}));

jest.mock("@/lib/mobile/web-mobile-api", () => ({
  createSessionId: jest.fn(() => "session-new-1"),
  fetchSession: jest.fn(),
  fetchSessions: jest.fn(),
  fileToDataUrl: jest.fn(),
  sendChatMessage: jest.fn(),
}));

jest.mock("@/lib/mobile/mobile-session", () => ({
  readStoredMobileProfile: jest.fn(() => ({
    displayName: "김수연",
    pregnancyWeekLabel: "18주 2일",
  })),
}));

jest.mock("./MobileChatMenu", () => ({
  MobileChatMenu: () => null,
}));

jest.mock("./useMobileSessionGuard", () => ({
  useMobileSessionGuard: jest.fn((userId: string | null) => userId),
}));

describe("MobileChatView", () => {
  beforeEach(() => {
    (fetchSession as jest.Mock).mockResolvedValue({
      session: {
        id: "session-new-1",
        title: "새 채팅",
        messages: [],
      },
    });
    (fetchSessions as jest.Mock).mockResolvedValue({ sessions: [] });
    (sendChatMessage as jest.Mock).mockRejectedValue(
      new Error("메시지를 전송하지 못했습니다."),
    );
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("marks optimistic drafts as failed when send fails", async () => {
    render(<MobileChatView userId="user-1" initialSessionId="new" />);

    const input = screen.getByPlaceholderText("증상이나 검사 결과를 입력하세요.");
    expect(input).toHaveClass("bg-[var(--field-surface)]");
    fireEvent.change(input, { target: { value: "복통이 있어요" } });
    fireEvent.click(screen.getByRole("button", { name: "메시지 보내기" }));

    await waitFor(() =>
      expect(screen.getAllByText("복통이 있어요").length).toBeGreaterThan(0),
    );

    await waitFor(() =>
      expect(
        screen.getByText("메시지를 전송하지 못했습니다."),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("전송 실패")).toBeInTheDocument();
    expect(sendChatMessage).toHaveBeenCalledWith({
      userId: "user-1",
      sessionId: "session-new-1",
      text: "복통이 있어요",
      imageDataUris: [],
    });
    expect(createSessionId).toHaveBeenCalled();
  });

  test("sends a quick reply button as a user chat message immediately", async () => {
    (sendChatMessage as jest.Mock).mockResolvedValueOnce({
      assistantMessage: {
        id: "assistant-1",
        role: "assistant",
        createdAtLabel: "방금 전",
        parts: [
          {
            type: "quickReplies",
            id: "quick-1",
            title: "빠르게 답해보세요",
            choices: [
              {
                id: "choice-1",
                label: "괜찮아요",
                message: "괜찮아요",
              },
            ],
          },
        ],
      },
      assistantMessages: [
        {
          id: "assistant-1",
          role: "assistant",
          createdAtLabel: "방금 전",
          parts: [
            {
              type: "quickReplies",
              id: "quick-1",
              title: "빠르게 답해보세요",
              choices: [
                {
                  id: "choice-1",
                  label: "괜찮아요",
                  message: "괜찮아요",
                },
              ],
            },
          ],
        },
      ],
      sessionId: "session-new-1",
    });

    render(<MobileChatView userId="user-1" initialSessionId="new" />);

    fireEvent.change(screen.getByPlaceholderText("증상이나 검사 결과를 입력하세요."), {
      target: { value: "오늘 상태를 알려줘" },
    });
    fireEvent.click(screen.getByRole("button", { name: "메시지 보내기" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "괜찮아요" })).toBeInTheDocument(),
    );

    (sendChatMessage as jest.Mock).mockResolvedValueOnce({
      assistantMessage: {
        id: "assistant-2",
        role: "assistant",
        createdAtLabel: "방금 전",
        parts: [{ type: "text", id: "p1", text: "좋아요." }],
      },
      assistantMessages: [
        {
          id: "assistant-2",
          role: "assistant",
          createdAtLabel: "방금 전",
          parts: [{ type: "text", id: "p1", text: "좋아요." }],
        },
      ],
      sessionId: "session-new-1",
    });

    fireEvent.click(screen.getByRole("button", { name: "괜찮아요" }));

    await waitFor(() =>
      expect(sendChatMessage).toHaveBeenLastCalledWith({
        userId: "user-1",
        sessionId: "session-new-1",
        text: "괜찮아요",
        imageDataUris: [],
      }),
    );
  });
});
