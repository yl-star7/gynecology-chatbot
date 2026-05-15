import { fireEvent, render, screen } from "@testing-library/react";

import type { AdminDashboardData } from "@gynecology-chatbot/app-core";

import AdminMoodVariantsSection from "./AdminMoodVariantsSection";

describe("AdminMoodVariantsSection", () => {
  const dashboard = {} as AdminDashboardData;

  it("shows_mood_intake_yaml_defaults_when_no_admin_override_exists", () => {
    render(
      <AdminMoodVariantsSection
        adminDisplayName="관리자"
        initialItems={[]}
        initialFallbackItems={[
          {
            scenario: "mood_intake",
            mood: "joyful",
            prompt_suffix:
              "좋은 마음이 느껴져서 저도 반가워요.\n그 밝은 기분을 오늘 안에서 잘 간직해봐요.",
          },
        ]}
        dashboard={dashboard}
      />,
    );

    expect(screen.getByText("YAML 기본")).toBeInTheDocument();
    expect(screen.getAllByText("앱에 바로 보이는 문구")).toHaveLength(2);
    expect(screen.getAllByText("프롬프트에 붙는 보조 지침")).toHaveLength(2);
    expect(
      screen.getAllByRole("columnheader", { name: "좋아요" }),
    ).toHaveLength(2);
    expect(
      screen.getAllByRole("columnheader", { name: "우울해요" }),
    ).toHaveLength(2);
    expect(
      screen.getAllByRole("columnheader", { name: "슬퍼요" }),
    ).toHaveLength(2);
    expect(
      screen.getAllByRole("columnheader", { name: "화나요" }),
    ).toHaveLength(2);
    expect(
      screen.getAllByRole("columnheader", {
        name: "직접 말하고 싶어요",
      }),
    ).toHaveLength(2);
    expect(
      screen.queryByRole("columnheader", { name: "짜증나요" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "피곤해요" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "기쁨" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "슬픔" }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /좋은 마음이 느껴져서 저도 반가워요/,
      }),
    );

    expect(screen.getByLabelText("앱에 바로 보이는 문구")).toHaveValue(
      "좋은 마음이 느껴져서 저도 반가워요.\n그 밝은 기분을 오늘 안에서 잘 간직해봐요.",
    );
  });

  it("labels_prompt_guidance_editor_for_non_mood_intake_scenarios", () => {
    render(
      <AdminMoodVariantsSection
        adminDisplayName="관리자"
        initialItems={[
          {
            id: "variant-1",
            scenario: "baby_info_offer",
            mood: "anxious",
            prompt_suffix: "사용자의 짜증을 먼저 짧게 인정하세요.",
            tone: null,
            active: true,
            has_snapshot: false,
            updated_at: "2026-05-13T00:00:00.000Z",
          },
        ]}
        dashboard={dashboard}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /사용자의 짜증을 먼저 짧게 인정하세요/,
      }),
    );

    expect(
      screen.getByRole("heading", { name: "아기 정보 제안 · 화나요" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("프롬프트 보조 지침")).toHaveValue(
      "사용자의 짜증을 먼저 짧게 인정하세요.",
    );
  });
});
