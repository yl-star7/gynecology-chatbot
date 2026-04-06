const GUARDRAIL_BLOCK_RULES = [
  {
    patterns: [
      /\b(fuck|shit|bitch|asshole)\b/i,
      /(씨발|시발|병신|꺼져|좆|개새)/i,
    ],
    reason:
      "상처를 주는 표현에는 답변하지 않고 있어요. 필요한 도움을 차분하게 적어주시면 안전하게 안내할게요.",
  },
  {
    patterns: [
      /(자해|해치고\s*싶|죽이고\s*싶|죽이는\s*법|폭탄|마약|사기|불법)/i,
      /\b(kill|suicide|bomb|drugs|fraud|scam)\b/i,
    ],
    reason:
      "위험하거나 해를 끼치는 요청은 도와드릴 수 없어요. 본인이나 다른 사람의 안전이 급하면 바로 119나 가까운 응급 도움을 요청해주세요.",
  },
] as const;

const OFF_TOPIC_PATTERNS = [
  /(주식|코인|비트코인|이더리움|축구|야구|로또|영화 추천|맛집|여행 일정|코드 작성|프로그래밍)/i,
  /\b(stock|bitcoin|crypto|soccer|baseball|lottery|movie recommendation|restaurant|travel itinerary|programming|code)\b/i,
];

const PREGNANCY_CONTEXT_PATTERNS = [
  /(임신|산모|태아|아기|출산|진통|복통|출혈|입덧|태동|수축|병원|진료|약|영양제|검사|초음파)/i,
  /\b(pregnan|baby|fetus|labor|bleeding|contraction|ultrasound|obgyn)\b/i,
];

export function detectHardGuardrailReason(text: string) {
  const normalized = text.trim();
  if (!normalized) {
    return null;
  }

  for (const rule of GUARDRAIL_BLOCK_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) {
      return rule.reason;
    }
  }

  const looksOffTopic = OFF_TOPIC_PATTERNS.some((pattern) =>
    pattern.test(normalized),
  );
  const looksPregnancyRelated = PREGNANCY_CONTEXT_PATTERNS.some((pattern) =>
    pattern.test(normalized),
  );

  if (looksOffTopic && !looksPregnancyRelated) {
    return "이 채팅은 임신과 건강 관련 안내에 집중하고 있어요. 몸 상태, 검사, 생활 관리처럼 필요한 내용을 보내주시면 그 범위에서 도와드릴게요.";
  }

  return null;
}
