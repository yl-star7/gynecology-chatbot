import assert from "node:assert/strict";
import test from "node:test";
import {
  resolvePatientContentLoadError,
  resolvePatientConversationSendError,
  resolvePatientProfileLoadError,
  resolvePatientRecordDayLoadError,
  resolvePatientSurveyLoadError,
  resolvePatientSurveySaveError,
} from "./patientErrorCopy.model.ts";

test("patient content load error hides raw backend messages", () => {
  assert.equal(
    resolvePatientContentLoadError(new Error("fetch failed: ECONNREFUSED")),
    "오늘 볼 수 있는 내용이 아직 준비되지 않았어요. 잠시 후 다시 확인해주세요.",
  );
});

test("patient profile load error preserves session-expired signal only", () => {
  assert.equal(
    resolvePatientProfileLoadError(new Error("세션이 만료되었어요. 다시 로그인해주세요.")),
    "세션이 만료되었어요. 다시 로그인해주세요.",
  );
  assert.equal(
    resolvePatientProfileLoadError(new Error("500 internal server error")),
    "내 정보를 불러오지 못했어요.",
  );
});

test("patient record day load error maps backend failure to warm copy", () => {
  assert.equal(
    resolvePatientRecordDayLoadError(new Error("failed to load day records")),
    "이 날짜 기록을 불러오지 못했어요. 잠시 후 다시 확인해 주세요.",
  );
});

test("patient survey load and save errors hide raw details", () => {
  assert.equal(
    resolvePatientSurveyLoadError(new Error("network timeout")),
    "설문 화면을 불러오지 못했어요.",
  );
  assert.equal(
    resolvePatientSurveySaveError(new Error("write failed")),
    "설문 답변을 저장하지 못했어요.",
  );
});

test("patient conversation send error keeps 429 guidance but hides other raw details", () => {
  assert.equal(
    resolvePatientConversationSendError(new Error("429 too many requests")),
    "잠시 쉬어 가요. 조금 뒤에 다시 이야기해요.",
  );
  assert.equal(
    resolvePatientConversationSendError(new Error("socket hang up")),
    "메시지를 보내지 못했어요. 다시 시도해주세요.",
  );
});
