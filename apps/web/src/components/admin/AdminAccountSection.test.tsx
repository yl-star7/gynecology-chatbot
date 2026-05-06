import { fireEvent, render, screen, within } from "@testing-library/react";

import { AdminAccountSection } from "./AdminAccountSection";

const managedUsers = [
  {
    id: "user-1",
    name: "김수연",
    phoneNumber: "01012345678",
    status: "attention" as const,
    accountStatus: "pending_recovery" as const,
    latestIssue: "세션 초기화 대기",
  },
  {
    id: "user-pending",
    name: "박대기",
    phoneNumber: "01099998888",
    status: "attention" as const,
    accountStatus: "pending_approval" as const,
    latestIssue: "관리자 승인 대기",
  },
  {
    id: "user-reject",
    name: "이거절",
    phoneNumber: "01088887777",
    status: "attention" as const,
    accountStatus: "pending_approval" as const,
    latestIssue: "관리자 승인 대기",
  },
];

function renderAccountSection(overrides = {}) {
  const props = {
    managedUsers,
    allowedPhoneNumbers: [],
    userSearchQuery: "",
    selectedUserId: "user-1",
    phoneNumber: "01012345678",
    reason: "",
    selectedAllowedPhoneId: "",
    allowedPhoneNumber: "",
    allowedDisplayName: "",
    allowedNote: "",
    actionMessage: null,
    isSubmitting: false,
    onUserSearchQueryChange: jest.fn(),
    onSelectUser: jest.fn(),
    onPhoneNumberChange: jest.fn(),
    onReasonChange: jest.fn(),
    onSelectAllowedPhone: jest.fn(),
    onAllowedPhoneNumberChange: jest.fn(),
    onAllowedDisplayNameChange: jest.fn(),
    onAllowedNoteChange: jest.fn(),
    onUpdatePhoneNumber: jest.fn(async () => {}),
    onResetSession: jest.fn(async () => {}),
    onPauseUser: jest.fn(async () => {}),
    onResumeUser: jest.fn(async () => {}),
    onApproveUser: jest.fn(async () => {}),
    onRejectUser: jest.fn(async () => {}),
    onCreateAllowedPhoneNumber: jest.fn(async () => {}),
    onUpdateAllowedPhoneNumber: jest.fn(async () => {}),
    onDeleteAllowedPhoneNumber: jest.fn(async () => {}),
    ...overrides,
  };

  render(<AdminAccountSection {...props} />);

  return props;
}

describe("AdminAccountSection", () => {
  it("shows pending users separately from active account management", () => {
    renderAccountSection();

    const pendingSection = screen
      .getByRole("heading", { name: "가입 승인 대기" })
      .closest("div.rounded-lg");
    expect(pendingSection).not.toBeNull();
    expect(
      within(pendingSection as HTMLElement).getByText("박대기"),
    ).toBeInTheDocument();
    expect(
      within(pendingSection as HTMLElement).getByText("01099998888"),
    ).toBeInTheDocument();
    expect(
      within(pendingSection as HTMLElement).getByText("이거절"),
    ).toBeInTheDocument();

    const activeSection = screen
      .getByRole("heading", { name: "사용자 관리" })
      .closest("div.rounded-lg");
    expect(activeSection).not.toBeNull();
    expect(
      within(activeSection as HTMLElement).getByText("김수연"),
    ).toBeInTheDocument();
    expect(
      within(activeSection as HTMLElement).queryByText("박대기"),
    ).not.toBeInTheDocument();
    expect(
      within(activeSection as HTMLElement).queryByText("이거절"),
    ).not.toBeInTheDocument();
  });

  it("sends approval and rejection decisions with the selected pending user id", () => {
    const onApproveUser = jest.fn(async () => {});
    const onRejectUser = jest.fn(async () => {});
    renderAccountSection({ onApproveUser, onRejectUser });

    const pendingSection = screen
      .getByRole("heading", { name: "가입 승인 대기" })
      .closest("div.rounded-lg") as HTMLElement;

    fireEvent.click(
      within(
        within(pendingSection).getByText("박대기").closest("tr") as HTMLElement,
      ).getByRole("button", { name: "승인" }),
    );
    expect(onApproveUser).toHaveBeenCalledWith("user-pending");

    fireEvent.click(
      within(
        within(pendingSection).getByText("이거절").closest("tr") as HTMLElement,
      ).getByRole("button", { name: "거절" }),
    );
    expect(onRejectUser).toHaveBeenCalledWith("user-reject");
  });
});
