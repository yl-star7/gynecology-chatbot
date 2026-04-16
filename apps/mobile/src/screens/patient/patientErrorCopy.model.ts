import { DEFAULT_CONTENT_EMPTY } from "./view-models/patient-copy";

const SESSION_EXPIRED_MESSAGE = "세션이 만료되었어요. 다시 로그인해주세요.";
const PROFILE_LOAD_ERROR = "내 정보를 불러오지 못했어요.";
const PROFILE_SAVE_ERROR = "저장하지 못했어요. 다시 시도해주세요.";
const PROFILE_REFRESH_ERROR =
  "저장은 됐지만 최신 정보를 다시 불러오지 못했어요. 화면을 잠시 뒤에 다시 열어 확인해주세요.";
const RECORD_DAY_LOAD_ERROR =
  "이 날짜 기록을 불러오지 못했어요. 잠시 후 다시 확인해 주세요.";
const SURVEY_LOAD_ERROR = "설문 화면을 불러오지 못했어요.";
const SURVEY_SAVE_ERROR = "설문 답변을 저장하지 못했어요.";
const CONVERSATION_RATE_LIMIT_ERROR =
  "잠시 쉬어 가요. 조금 뒤에 다시 이야기해요.";
const CONVERSATION_SEND_ERROR = "메시지를 보내지 못했어요. 다시 시도해주세요.";
const CONVERSATION_LOAD_NOT_FOUND_ERROR =
  "대화를 찾지 못했어요. 다른 상담을 선택해 주세요.";
const CONVERSATION_LOAD_ERROR =
  "대화를 불러오지 못했어요. 잠시 후 다시 시도해주세요.";

function readErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "";
}

export function resolvePatientProfileLoadError(error: unknown) {
  return readErrorMessage(error).includes("세션이 만료되었어요")
    ? SESSION_EXPIRED_MESSAGE
    : PROFILE_LOAD_ERROR;
}

export function resolvePatientProfileSaveError(error: unknown) {
  const message = readErrorMessage(error).trim();
  if (message.includes("세션이 만료되었어요")) {
    return SESSION_EXPIRED_MESSAGE;
  }
  if (/[가-힣]/.test(message)) {
    return message;
  }
  return PROFILE_SAVE_ERROR;
}

export function resolvePatientProfileRefreshError(error: unknown) {
  const message = readErrorMessage(error).trim();
  if (message.includes("세션이 만료되었어요")) {
    return SESSION_EXPIRED_MESSAGE;
  }
  if (/[가-힣]/.test(message)) {
    return message;
  }
  return PROFILE_REFRESH_ERROR;
}

export function resolvePatientRecordDayLoadError(_error: unknown) {
  return RECORD_DAY_LOAD_ERROR;
}

export function resolvePatientSurveyLoadError(_error: unknown) {
  return SURVEY_LOAD_ERROR;
}

export function resolvePatientSurveySaveError(_error: unknown) {
  return SURVEY_SAVE_ERROR;
}

export function resolvePatientContentLoadError(_error: unknown) {
  return DEFAULT_CONTENT_EMPTY;
}

export function resolvePatientConversationSendError(error: unknown) {
  const message = readErrorMessage(error);
  if (message.includes("429")) return CONVERSATION_RATE_LIMIT_ERROR;
  if (message.includes("세션이 만료되었어요")) return SESSION_EXPIRED_MESSAGE;
  return CONVERSATION_SEND_ERROR;
}

export function resolvePatientConversationLoadError(error: unknown) {
  const message = readErrorMessage(error);
  if (message.includes("세션이 만료되었어요")) return SESSION_EXPIRED_MESSAGE;
  if (message.toLowerCase().includes("not found")) {
    return CONVERSATION_LOAD_NOT_FOUND_ERROR;
  }
  return CONVERSATION_LOAD_ERROR;
}
