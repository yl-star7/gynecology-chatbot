type ManagedUserStatus = "active" | "attention" | "paused";
type RecoveryStatus = "pending" | "completed";
type DocumentStatus = "ready" | "draft";
type WeekStatus = "draft" | "published" | "archived";
type WorkflowStatus = "active" | "review";
type SessionRole = "user" | "assistant";

const USER_ACTION_TYPE_LABELS: Record<string, string> = {
  login_succeeded: "로그인 완료",
  phone_verification_started: "문자 인증 요청",
  phone_verified: "문자 인증 완료",
  onboarding_completed: "초기 정보 입력 완료",
  profile_updated: "프로필 수정",
  chat_message_sent: "채팅 메시지 전송",
  account_paused: "사용 중단",
  account_resumed: "사용 재개",
  account_approved: "사용 승인",
};

const ADMIN_EVENT_LABELS: Record<string, string> = {
  active: "정상 이용 중",
  paused: "사용 중단 상태",
  deleted: "삭제된 계정",
  pending_recovery: "접근 복구 대기",
  pending_approval: "사용 승인 대기",
  content_update: "콘텐츠 설정 변경",
  phone_change: "전화번호 변경",
  session_reset: "세션 초기화",
  account_pause: "사용 중단",
  account_resume: "사용 재개",
  account_approve: "사용 승인",
  allowed_phone_number_create: "허용 전화번호 추가",
  allowed_phone_number_update: "허용 전화번호 수정",
  allowed_phone_number_delete: "허용 전화번호 삭제",
};

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

  if (action === "session_reset") {
    return "세션 초기화";
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

export function getUserActionTypeLabel(actionType: string) {
  return USER_ACTION_TYPE_LABELS[actionType] ?? actionType;
}

export function getAdminEventLabel(value: string) {
  return ADMIN_EVENT_LABELS[value] ?? value;
}

type RagFileStatus = "processing" | "ready" | "failed";

export function getRagFileStatusLabel(status: RagFileStatus) {
  if (status === "ready") return "완료";
  if (status === "failed") return "실패";
  return "처리 중";
}

export function getRagFileStatusBadge(status: RagFileStatus) {
  if (status === "ready") return "statusSuccess";
  if (status === "failed") return "statusError";
  return "statusWarning";
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
