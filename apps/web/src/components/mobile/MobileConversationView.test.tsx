import { render, screen, waitFor } from "@testing-library/react";

import { fetchSession } from "@/lib/mobile/web-mobile-api";
import { MobileConversationView } from "./MobileConversationView";

jest.mock("@/lib/mobile/web-mobile-api", () => ({
  createSessionId: jest.fn(() => "session-1"),
  fetchSession: jest.fn(),
  sendChatMessage: jest.fn(),
}));

jest.mock("./useMobileSessionGuard", () => ({
  useMobileSessionGuard: jest.fn((userId: string | null) => userId),
}));

describe("MobileConversationView", () => {
  beforeEach(() => {
    (fetchSession as jest.Mock).mockResolvedValue({
      session: {
        id: "session-1",
        title: "아기와 나누는 마음",
        messages: [
          {
            id: "assistant-1",
            role: "assistant",
            createdAtLabel: "방금 전",
            parts: [
              {
                type: "image",
                id: "character-1",
                imageUrl: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' />",
                alt: "anxious 캐릭터 표현",
                caption: "워크플로우가 선택한 캐릭터 표정",
              },
              {
                type: "text",
                id: "text-1",
                text: "지금은 쉬면서 상태를 살펴봐요.",
              },
            ],
          },
        ],
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders assistant character imagery from rich chat parts", async () => {
    render(
      <MobileConversationView userId="user-1" initialSessionId="session-1" />,
    );

    await waitFor(() =>
      expect(screen.getByAltText("anxious 캐릭터 표현")).toBeInTheDocument(),
    );
    expect(
      screen.getByText("워크플로우가 선택한 캐릭터 표정"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("지금은 쉬면서 상태를 살펴봐요."),
    ).toBeInTheDocument();
  });
});
