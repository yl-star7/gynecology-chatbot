import { render, screen } from "@testing-library/react";

import {
  AdminOpsAuditSection,
  type AdminOpsAuditLogRow,
} from "./AdminOpsAuditSection";

describe("AdminOpsAuditSection", () => {
  it("표시할 감사 로그가 없을 때 안내 문구를 렌더링한다", () => {
    render(<AdminOpsAuditSection logs={[]} />);

    expect(
      screen.getByText("표시할 감사 로그가 없습니다."),
    ).toBeInTheDocument();
  });

  it("감사 로그 행을 운영자/행동/대상/전·후 요약과 함께 표시한다", () => {
    const logs: AdminOpsAuditLogRow[] = [
      {
        id: "11111111-2222-3333-4444-555555555555",
        actorDisplayName: "관리자1",
        actionType: "pause_user",
        entityType: "users",
        entityId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        reason: "테스트",
        beforeSummary: '{"status":"active"}',
        afterSummary: '{"status":"paused"}',
        createdAt: "2026-04-24T00:00:00.000Z",
      },
    ];

    render(<AdminOpsAuditSection logs={logs} />);

    expect(screen.getByText("관리자1")).toBeInTheDocument();
    expect(screen.getByText("pause_user")).toBeInTheDocument();
    expect(screen.getByText("users")).toBeInTheDocument();
    expect(screen.getByText(/aaaaaaaa/)).toBeInTheDocument();
    expect(screen.getByText('{"status":"active"}')).toBeInTheDocument();
    expect(screen.getByText('{"status":"paused"}')).toBeInTheDocument();
    expect(screen.getByText("최근 1건")).toBeInTheDocument();
  });
});
