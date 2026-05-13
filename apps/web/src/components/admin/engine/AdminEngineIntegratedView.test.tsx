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
    expect(screen.getByText("참조 trace")).toBeInTheDocument();
    expect(screen.getByText("앱 미리보기")).toBeInTheDocument();
    expect(screen.getByText("수정 위치")).toBeInTheDocument();
    expect(screen.getByText("대화 엔진 > 기분별 변주")).toBeInTheDocument();
    expect(screen.getByText("대화 엔진 > 워크플로우")).toBeInTheDocument();
  });

  it("updates the preview and trace when a mood button is selected", () => {
    render(<AdminEngineIntegratedView adminDisplayName="운영자" />);

    fireEvent.click(screen.getByRole("button", { name: "짜증나요" }));

    expect(
      screen.getByText(/많이 답답하고 예민해진 상황이었나 봐요/),
    ).toBeInTheDocument();
    expect(screen.getAllByText("mood_intake.angry").length).toBeGreaterThan(0);
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
    fireEvent.change(screen.getByLabelText("기분 문구 내용"), {
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
});
