type ManagedUserStatus = "active" | "attention" | "paused";
type RecoveryStatus = "pending" | "completed";
type DocumentStatus = "ready" | "draft";
type WeekStatus = "draft" | "published" | "archived";
type WorkflowStatus = "active" | "review";
type SessionRole = "user" | "assistant";

export function getManagedUserStatusLabel(status: ManagedUserStatus) {
  if (status === "active") {
    return "정상";
  }

  if (status === "paused") {
    return "중지";
  }

  return "확인 필요";
}

export function getManagedUserStatusBadge(status: ManagedUserStatus) {
  if (status === "active") {
    return "statusSuccess";
  }

  if (status === "paused") {
    return "statusError";
  }

  return "statusWarning";
}

export function getRecoveryActionLabel(action: string) {
  if (action === "phone_change") {
    return "전화번호 변경";
  }

  if (action === "password_reset") {
    return "비밀번호 재설정";
  }

  if (action === "login_id_change") {
    return "로그인 ID 변경";
  }

  return action;
}

export function getRecoveryStatusLabel(status: RecoveryStatus) {
  return status === "completed" ? "완료" : "대기";
}

export function getRecoveryStatusBadge(status: RecoveryStatus) {
  return status === "completed" ? "statusSuccess" : "statusWarning";
}

export function getDocumentStatusLabel(status: DocumentStatus) {
  return status === "ready" ? "배포 가능" : "작성 중";
}

export function getDocumentStatusBadge(status: DocumentStatus) {
  return status === "ready" ? "statusSuccess" : "statusWarning";
}

export function getWeekStatusLabel(status: WeekStatus) {
  if (status === "published") {
    return "게시됨";
  }

  if (status === "archived") {
    return "보관됨";
  }

  return "초안";
}

export function getWeekStatusBadge(status: WeekStatus) {
  if (status === "published") {
    return "statusSuccess";
  }

  if (status === "archived") {
    return "statusMuted";
  }

  return "statusWarning";
}

export function getWorkflowStatusLabel(status: WorkflowStatus) {
  return status === "active" ? "활성" : "검토";
}

export function getWorkflowStatusBadge(status: WorkflowStatus) {
  return status === "active" ? "statusSuccess" : "statusWarning";
}

export function getSessionRoleLabel(role: SessionRole) {
  return role === "assistant" ? "AI 응답" : "사용자";
}

export function getSessionRoleBadge(role: SessionRole) {
  return role === "assistant" ? "statusSuccess" : "";
}
