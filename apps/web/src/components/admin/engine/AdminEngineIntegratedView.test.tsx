import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AdminEngineIntegratedView } from "./AdminEngineIntegratedView";

jest.mock("@/components/AdminPageFrame", () => {
  return function MockAdminPageFrame({
    children,
    currentPath,
    title,
  }: {
    children: React.ReactNode;
    currentPath: string;
    title: string;
  }) {
    return (
      <div data-current-path={currentPath}>
        <h1>{title}</h1>
        {children}
      </div>
    );
  };
});

describe("AdminEngineIntegratedView", () => {
  it("shows the integrated engine flow outside the workflow editor", () => {
    render(<AdminEngineIntegratedView adminDisplayName="운영자" />);

    expect(screen.getByText("대화 엔진 통합 뷰")).toBeInTheDocument();
    expect(screen.getByText("통합 흐름")).toBeInTheDocument();
    expect(screen.getByText("기준일")).toBeInTheDocument();
    expect(screen.getByText("실제 흐름")).toBeInTheDocument();
    expect(screen.getByText("참조")).toBeInTheDocument();
    expect(screen.getByText("앱 미리보기")).toBeInTheDocument();
    expect(screen.getByText("편집")).toBeInTheDocument();
    expect(
      screen.getAllByText("문구 · 프롬프트 · 참조").length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText(/fallback/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/mood_intake/)).not.toBeInTheDocument();
  });

  it("updates the preview and selection state when a mood button is selected", () => {
    render(<AdminEngineIntegratedView adminDisplayName="운영자" />);

    fireEvent.click(screen.getByRole("button", { name: "짜증나요" }));

    expect(
      screen.getByText(/많이 답답하고 예민해진 상황이었나 봐요/),
    ).toBeInTheDocument();
    expect(screen.getByText("짜증나요 · 기분 문구")).toBeInTheDocument();
    expect(screen.queryByText(/mood_intake/)).not.toBeInTheDocument();
  });

  it("edits the selected mood copy in a modal", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        item: {
          id: "mood-joyful",
          scenario: "mood_intake",
          mood: "joyful",
          prompt_suffix: "새로 저장한 문구예요.",
          tone: null,
          active: true,
          has_snapshot: false,
          updated_at: "2026-05-14T00:00:00.000Z",
        },
      }),
    } as Response);

    render(
      <AdminEngineIntegratedView
        adminDisplayName="운영자"
        initialMoodItems={[
          {
            id: "mood-joyful",
            scenario: "mood_intake",
            mood: "joyful",
            prompt_suffix: "기존 문구예요.",
            tone: null,
            active: true,
            has_snapshot: false,
            updated_at: "2026-05-14T00:00:00.000Z",
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "좋아요 문구 수정" }));
    expect(screen.getByText("좋아요 선택 뒤 말풍선")).toBeInTheDocument();
    expect(screen.queryByText(/mood_intake/)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("앱 말풍선"), {
      target: { value: "새로 저장한 문구예요." },
    });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => {
      expect(screen.getByText("새로 저장한 문구예요.")).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/engine/moods/mood-joyful",
      expect.objectContaining({ method: "PATCH" }),
    );

    fetchMock.mockRestore();
  });

  it("edits prompt text and adds references inside a flow modal", () => {
    render(<AdminEngineIntegratedView adminDisplayName="운영자" />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "참조 자료 문구 · 프롬프트 · 참조",
      }),
    );
    fireEvent.change(screen.getByLabelText("프롬프트 내용"), {
      target: { value: "새 참조 규칙" },
    });
    fireEvent.change(screen.getByLabelText("참조 추가"), {
      target: { value: "새 자료" },
    });
    fireEvent.click(screen.getByRole("button", { name: "추가" }));
    expect(screen.getByText("새 자료")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "반영" }));

    expect(screen.getByText("화면에 반영되었습니다.")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: "참조 자료 문구 · 프롬프트 · 참조",
      }),
    );
    expect(screen.getByDisplayValue("새 참조 규칙")).toBeInTheDocument();
    expect(screen.getByText("새 자료")).toBeInTheDocument();
  });
});
