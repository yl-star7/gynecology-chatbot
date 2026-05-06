/**
 * 기분별 변주 매트릭스의 허용 시나리오 · 기분 값 정의.
 *
 * scenario 목록은 `docs/active/2026-04-24-tag-namespaces-proposal.md` §1.5,
 * mood 목록은 `system_config.character_images` 와 동일한 5 tone 을 따릅니다.
 */

export const MOOD_VARIANT_SCENARIOS = [
  { value: "mood_intake", label: "기분 선택" },
  { value: "week_info_opt_in", label: "주차 정보 제안" },
  { value: "baby_info_offer", label: "아기 정보 제안" },
  { value: "baby_info", label: "아기 정보" },
  { value: "mother_info", label: "엄마 정보" },
  { value: "week_info", label: "주차 정보" },
  { value: "symptom_counsel", label: "증상 상담" },
  { value: "emotion_checkin", label: "감정 체크인" },
  { value: "emotion_reason", label: "감정 이유" },
  { value: "attachment_question", label: "모아애착 질문" },
  { value: "letter_reflection", label: "편지 회신" },
  { value: "daily_followup", label: "오늘 후속 대화" },
  { value: "empathy_chat", label: "공감 대화" },
  { value: "general", label: "일반" },
] as const;

export type MoodVariantScenario =
  (typeof MOOD_VARIANT_SCENARIOS)[number]["value"];

export const MOOD_VARIANT_MOODS = [
  { value: "calm", label: "평온" },
  { value: "joyful", label: "기쁨" },
  { value: "anxious", label: "불안" },
  { value: "tired", label: "지침" },
  { value: "sad", label: "슬픔" },
] as const;

export type MoodVariantMood = (typeof MOOD_VARIANT_MOODS)[number]["value"];

const SCENARIO_SET = new Set<string>(
  MOOD_VARIANT_SCENARIOS.map((item) => item.value),
);
const MOOD_SET = new Set<string>(MOOD_VARIANT_MOODS.map((item) => item.value));

export function isMoodVariantScenario(
  value: unknown,
): value is MoodVariantScenario {
  return typeof value === "string" && SCENARIO_SET.has(value);
}

export function isMoodVariantMood(value: unknown): value is MoodVariantMood {
  return typeof value === "string" && MOOD_SET.has(value);
}
