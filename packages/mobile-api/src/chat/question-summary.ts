/**
 * stage=2 에서 오늘의 질문에 대한 사용자 응답 + AI 답변을 요약해 calendar_logs 에 저장.
 * entry_type="question_summary", 기존 "chat_saved" 와 분리된 daily 기록 엔트리.
 *
 * 호출: 서버 chat 라우트에서 stage=2 LLM 턴 완료 후 fire-and-forget.
 */

export type QuestionSummaryInput = {
  userId: string;
  sessionId: string | null;
  dateKey: string; // "YYYY-MM-DD" KST
  questionId: string;
  questionText: string | null;
  userAnswer: string; // 사용자의 원문
  assistantAnswer: string; // AI 응답 본문 (요약 전)
  compactSummary: string | null;
  emotionTone: string | null;
  moodId: string | null;
  moodLabel: string | null;
};

export type QuestionSummaryRecord = {
  userId: string;
  sessionId: string | null;
  date: string;
  entryType: "question_summary";
  title: string;
  summary: string;
  payload: {
    questionId: string;
    question: string | null;
    answer: string;
    aiResponse: string;
    compactSummary: string | null;
    emotionTone: string | null;
    moodId: string | null;
    moodLabel: string | null;
    source: "attachment_question_followup";
    createdAt: string;
  };
};

/**
 * 요약 문자열 생성 — compactSummary 우선, 없으면 사용자 답변 앞머리 사용.
 * LLM 재호출 없이 즉시 생성 (latency 0ms).
 */
export function buildSummaryText(
  input: Pick<QuestionSummaryInput, "compactSummary" | "userAnswer"> & {
    questionText?: string | null;
  },
): string {
  const compact = input.compactSummary?.replace(/^현재 단계:\s*/u, "").trim();
  if (
    compact &&
    compact.length >= 10 &&
    !isQuestionSummaryPendingText(compact)
  ) {
    return compact.slice(0, 220);
  }
  return buildFallbackQuestionAnswerSummary({
    questionText: input.questionText ?? null,
    userAnswer: input.userAnswer,
  }).slice(0, 220);
}

export function isQuestionSummaryPendingText(text: string | null | undefined) {
  const normalized = text?.replace(/^현재 단계:\s*/u, "").trim() ?? "";
  return /오늘의 질문 준비|질문 답변 대기|질문 답변 중|질문 답변 종료 신호|자정에 요약이 준비|요약이 준비됩니다/.test(
    normalized,
  );
}

function isQuestionSummaryPreAnswerText(text: string | null | undefined) {
  const normalized = text?.replace(/^현재 단계:\s*/u, "").trim() ?? "";
  return /오늘의 질문 준비|질문 답변 대기|질문 답변 종료 신호/.test(normalized);
}

function normalizeAnswerText(text: string | null | undefined) {
  return text?.replace(/\s+/g, " ").trim() ?? "";
}

export function isQuestionAnswerText(input: {
  userAnswer: string | null | undefined;
  questionText?: string | null;
}) {
  const answer = normalizeAnswerText(input.userAnswer);
  if (!answer) return false;
  if (/^(안녕|안녕하세요|하이|hello|hi)$/i.test(answer)) return false;
  if (isQuestionSummaryPendingText(answer)) return false;
  if (
    input.questionText &&
    answer === normalizeAnswerText(input.questionText)
  ) {
    return false;
  }
  if (
    /^(다음 질문|오늘은 여기까지|이만 마칠|마칠게요|여기까지|그만할게요|그만 할게요|자유롭게|나중에 볼게요|더 확인하고 싶어요|아기 발달 정보를 볼래요|오늘 실천할 일도 볼게요)/.test(
      answer,
    )
  ) {
    return false;
  }
  if (/하나 더.*(이야기|얘기|말).*싶/.test(answer)) {
    return false;
  }
  return true;
}

function dedupeRepeatedShortAnswer(text: string) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.length % 2 === 0) {
    const midpoint = words.length / 2;
    const first = words.slice(0, midpoint).join(" ");
    const second = words.slice(midpoint).join(" ");
    if (first === second) return first;
  }

  const repeatedPhrase = text.match(/^(.{2,40})(?:\s+\1)+$/u);
  return repeatedPhrase?.[1]?.trim() ?? text;
}

export function buildFallbackQuestionAnswerSummary(input: {
  questionText?: string | null;
  userAnswer: string | null | undefined;
}) {
  const answer = normalizeAnswerText(input.userAnswer);
  if (!answer) return "";

  const deduped = dedupeRepeatedShortAnswer(answer).replace(
    /[.!?。]+$/u,
    "",
  );
  const question = input.questionText ?? "";

  if (/피부|붓|부어|몸 신호|피로/.test(`${question} ${deduped}`)) {
    return "피부가 붓는 몸의 신호를 불편함으로 느끼고 있어요. 몸이 보내는 변화를 살피며 돌봄이 필요하다고 느낀 기록이에요.";
  }

  if (/태동/.test(`${question} ${deduped}`)) {
    return "태동이 평소와 비슷하거나 조금 덜한 것 같다고 느꼈어요. 몸의 변화를 살피며 조심스럽게 마음을 기울인 기록이에요.";
  }

  if (/운동/.test(question) && /수영/.test(deduped)) {
    return "아기가 태어나면 함께 수영을 해보고 싶다는 바람을 남겼어요. 물속에서 같이 움직이는 시간을 기대한 기록이에요.";
  }

  if (/별자리/.test(question) && /상징|뭐야|궁금/.test(deduped)) {
    return "아기가 태어날 시기의 별자리와 그 상징을 궁금해했어요. 아이에게 물려주고 싶은 성품과 이야기를 떠올리기 위한 질문을 남긴 기록이에요.";
  }

  if (/건망증|기억|추억/.test(question) && /따뜻한 말/.test(deduped)) {
    return "아기에게 따뜻한 말을 건네며 이 시기를 기억하고 싶다는 마음을 남겼어요. 새 생명을 품은 지금의 순간을 다정하게 붙잡은 기록이에요.";
  }

  if (/잘 모르겠/.test(deduped)) {
    return "아직 쉽게 답을 찾지 못하고 있다는 마음을 남겼어요. 놓지 못한 감정이나 경험을 천천히 살펴볼 여지를 남긴 기록이에요.";
  }

  if (/잘 키워/.test(deduped)) {
    return "임신을 점차 나의 일부로 받아들이며, 아이를 잘 키우고 싶다는 다짐을 남겼어요. 엄마가 되어가는 마음을 조심스럽게 붙잡은 기록이에요.";
  }

  if (/잘 견뎠/.test(deduped) && /28주|몸|키워낸/.test(question)) {
    return "28주 동안 아기를 키워낸 몸에게 오늘도 잘 견뎌줘서 고맙다는 말을 건네고 싶어 했어요. 버텨낸 하루를 다정하게 인정한 기록이에요.";
  }

  if (/걱정/.test(deduped) && /노래|리듬|움직/.test(question)) {
    return "아기의 활발한 움직임을 떠올리며 조금 걱정되는 마음을 남겼어요. 그래도 노래와 리듬으로 아기와 다정하게 교감하고 싶은 기록이에요.";
  }

  if (/걱정/.test(deduped) && /몸|28주|가지/.test(question)) {
    return "28주 동안 아기를 키워낸 몸이 고맙지만, 한편으로는 걱정도 남아 있어요. 남은 시간을 조심스럽게 살피고 싶은 마음의 기록이에요.";
  }

  if (/고생/.test(deduped) && /몸|태반|초유|엄마/.test(question)) {
    return "태반과 초유를 준비해 온 몸을 보며, 몸이 참 고생하고 있다는 마음을 표현했어요. 엄마가 될 준비를 해내는 몸을 다정하게 바라본 기록이에요.";
  }

  if (deduped.length <= 35) {
    return `답변으로 "${deduped}"라고 남겼어요. 질문을 통해 지금 몸과 마음을 짧게 돌아본 기록이에요.`;
  }

  return deduped.slice(0, 220);
}

export function buildQuestionSummaryTitle(questionText: string | null) {
  const question = questionText?.replace(/\s+/g, " ").trim() ?? "";
  if (!question) return "오늘의 질문 기록";

  if (/피부|붓|부어|몸 신호|피로/.test(question)) {
    return "몸의 신호를 살핀 기록";
  }

  if (/태동/.test(question)) {
    return "태동을 살핀 마음";
  }

  if (/운동/.test(question)) {
    return "아기와 함께할 운동";
  }

  if (/별자리/.test(question)) {
    return "아기 별자리 이야기";
  }

  if (/건망증|기억|추억/.test(question)) {
    return "기억에 남기고 싶은 순간";
  }

  if (/노래|리듬|움직/.test(question)) {
    return "아기와 나눌 리듬";
  }

  if (/놓지 못하고|꽉 쥐고/.test(question)) {
    return "놓지 못한 마음";
  }

  if (/받아들이기 어려웠|나의 일부|다짐/.test(question)) {
    return "엄마가 되어가는 다짐";
  }

  if (/태반|초유|엄마가 될 준비/.test(question)) {
    return "몸의 준비를 바라본 마음";
  }

  if (/28주|키워낸.*몸|몸에게/.test(question)) {
    return "28주간 함께한 몸";
  }

  if (/마음|느낌|기분/.test(question)) {
    return "오늘 마음을 돌아본 기록";
  }

  if (/준비|계획/.test(question)) {
    return "앞으로의 준비를 떠올린 기록";
  }

  return question
    .replace(/[?？]\s*$/u, "")
    .replace(/^(Q\.?\s*)/iu, "")
    .slice(0, 28);
}

export function resolveQuestionSummaryQuestionId(input: {
  selectedQuestionId?: string | null;
  currentAttachmentQuestionId?: string | null;
  nextAttachmentQuestionId?: string | null;
}) {
  return (
    input.selectedQuestionId ??
    input.currentAttachmentQuestionId ??
    input.nextAttachmentQuestionId ??
    null
  );
}

/**
 * 제목 = 질문 앞머리 or fallback.
 */
export function buildTitle(
  questionText: string | null,
  fallback = "오늘의 질문",
): string {
  if (fallback === "오늘의 질문") {
    return buildQuestionSummaryTitle(questionText);
  }
  if (!questionText) return fallback;
  const trimmed = questionText.replace(/\s+/g, " ").trim();
  return trimmed.length > 0 ? trimmed.slice(0, 40) : fallback;
}

/**
 * DB 저장용 record 생성 (pure).
 * 실제 저장은 호출 측에서 prisma.calendar_logs.create() 로.
 */
export function buildQuestionSummaryRecord(
  input: QuestionSummaryInput,
): QuestionSummaryRecord {
  return {
    userId: input.userId,
    sessionId: input.sessionId,
    date: input.dateKey,
    entryType: "question_summary",
    title: buildTitle(input.questionText),
    summary: buildSummaryText({
      compactSummary: input.compactSummary,
      userAnswer: input.userAnswer,
      questionText: input.questionText,
    }),
    payload: {
      questionId: input.questionId,
      question: input.questionText,
      answer: input.userAnswer.replace(/\s+/g, " ").trim().slice(0, 1000),
      aiResponse: input.assistantAnswer
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 1200),
      compactSummary: input.compactSummary,
      emotionTone: input.emotionTone,
      moodId: input.moodId,
      moodLabel: input.moodLabel,
      source: "attachment_question_followup",
      createdAt: new Date().toISOString(),
    },
  };
}

/**
 * stage=2 턴에서 선택된 질문 ID가 존재하고, 해당 질문이 처음으로 요약 저장되는지 판별.
 * 이미 같은 date/session/questionId 로 저장된 기록이 있으면 skip (중복 방지).
 */
export function shouldSaveQuestionSummary(input: {
  workflowStage: unknown;
  selectedQuestionId: string | null;
  alreadyPersistedQuestionIds: Set<string>;
  compactSummary?: string | null;
}): boolean {
  if (input.workflowStage !== 2 && input.workflowStage !== "2") return false;
  if (!input.selectedQuestionId) return false;
  if (input.alreadyPersistedQuestionIds.has(input.selectedQuestionId))
    return false;
  if (isQuestionSummaryPreAnswerText(input.compactSummary)) return false;
  return true;
}
