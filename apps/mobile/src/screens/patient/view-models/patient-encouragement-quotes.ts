const OPENERS = [
  "오늘도",
  "지금 이 순간도",
  "천천히 걸어도",
  "가볍게 숨을 고르면",
  "마음을 다잡는 오늘도",
  "조용히 하루를 건너는 지금도",
  "몸의 신호를 살피는 오늘도",
  "아기를 떠올리는 매 순간도",
];

const MIDDLES = [
  "엄마의 하루는",
  "당신의 마음은",
  "지금의 한 걸음은",
  "이 조용한 버팀은",
  "오늘의 선택은",
  "지금 느끼는 감정도",
  "작은 휴식 하나도",
  "아기를 향한 생각 하나도",
];

const CLOSERS = [
  "충분히 잘하고 있어요.",
  "아기에게 분명 따뜻하게 닿고 있어요.",
  "이미 소중한 돌봄이 되고 있어요.",
  "그 자체로 의미 있는 기록이에요.",
  "서두르지 않아도 괜찮아요.",
  "오늘의 속도로도 아주 괜찮아요.",
  "지금처럼 차분히 이어가면 돼요.",
  "하루를 버틴 것만으로도 충분해요.",
];

export const PATIENT_ENCOURAGEMENT_QUOTES = OPENERS.flatMap((opener) =>
  MIDDLES.flatMap((middle) => CLOSERS.map((closer) => `${opener} ${middle} ${closer}`)),
);

export function pickPatientEncouragementQuote(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return PATIENT_ENCOURAGEMENT_QUOTES[hash % PATIENT_ENCOURAGEMENT_QUOTES.length];
}
