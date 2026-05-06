import { render, screen } from "@testing-library/react";

import { AdminChatActionsFeed } from "./AdminChatActionsFeed";

const userId = "6e789ecc-d48a-4535-8ad9-1303dcddb8e5";

describe("AdminChatActionsFeed", () => {
  it("uses phone numbers for action log search and row identity", () => {
    render(
      <AdminChatActionsFeed
        actions={[
          {
            id: "log-1",
            userId,
            userLabel: "김수연",
            phoneNumber: "01012345678",
            actionType: "phone_verification_started",
            detail: '{"flow":"sign_in"}',
            occurredAt: "2026-04-29T00:17:00.000Z",
          },
        ]}
        actionTypes={["phone_verification_started"]}
        initialFilters={{
          phoneNumber: "01012345678",
          actionType: "all",
          from: "",
          to: "",
        }}
        limit={200}
      />,
    );

    expect(screen.getByLabelText("전화번호")).toHaveValue("01012345678");
    expect(screen.getByPlaceholderText("01012345678")).toBeInTheDocument();
    expect(screen.queryByLabelText("사용자 ID")).not.toBeInTheDocument();
    expect(screen.getByText("01012345678")).toBeInTheDocument();
    expect(screen.queryByText(userId)).not.toBeInTheDocument();
  });
});
