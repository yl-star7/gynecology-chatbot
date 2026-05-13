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

    fireEvent.click(
      screen.getByRole("button", {
        name: /좋은 마음이 느껴져서 저도 반가워요/,
      }),
    );

    expect(screen.getByLabelText("실제 반영 문구")).toHaveValue(
      "좋은 마음이 느껴져서 저도 반가워요.\n그 밝은 기분을 오늘 안에서 잘 간직해봐요.",
    );
  });
});
