import type {
  HomeCopyItem,
  HomeCopyItemInput,
  HomeCopySlot,
  HomeCopyStatus,
} from "./domain";

export const HOME_COPY_CONFIG_KEY = "home_main_copy";

export const HOME_COPY_SLOTS: HomeCopySlot[] = [
  "hero_bubble",
  "daily_note",
  "encouragement_quote",
];

export const HOME_COPY_STATUSES: HomeCopyStatus[] = [
  "draft",
  "published",
  "archived",
];

const DEFAULT_UPDATED_AT = "2026-01-01T00:00:00.000Z";

const ENCOURAGEMENT_OPENERS = [
  "오늘도",
  "지금 이 순간도",
  "천천히 걸어도",
  "가볍게 숨을 고르면",
  "마음을 다잡는 오늘도",
  "조용히 하루를 건너는 지금도",
  "몸의 신호를 살피는 오늘도",
  "아기를 떠올리는 매 순간도",
];

const ENCOURAGEMENT_MIDDLES = [
  "엄마의 하루는",
  "당신의 마음은",
  "지금의 한 걸음은",
  "이 조용한 버팀은",
  "오늘의 선택은",
  "지금 느끼는 감정도",
  "작은 휴식 하나도",
  "아기를 향한 생각 하나도",
];

const ENCOURAGEMENT_CLOSERS = [
  "충분히 잘하고 있어요.",
  "아기에게 분명 따뜻하게 닿고 있어요.",
  "이미 소중한 돌봄이 되고 있어요.",
  "그 자체로 의미 있는 기록이에요.",
  "서두르지 않아도 괜찮아요.",
  "오늘의 속도로도 아주 괜찮아요.",
  "지금처럼 차분히 이어가면 돼요.",
  "하루를 버틴 것만으로도 충분해요.",
];

export const PATIENT_ENCOURAGEMENT_QUOTES = ENCOURAGEMENT_OPENERS.flatMap(
  (opener) =>
    ENCOURAGEMENT_MIDDLES.flatMap((middle) =>
      ENCOURAGEMENT_CLOSERS.map((closer) => `${opener} ${middle} ${closer}`),
    ),
);

const DEFAULT_ENCOURAGEMENT_COPY_ITEMS: HomeCopyItem[] =
  PATIENT_ENCOURAGEMENT_QUOTES.map((quote, index) => ({
    id: `default-encouragement-${String(index + 1).padStart(2, "0")}`,
    slot: "encouragement_quote",
    variant: null,
    title: `응원 문구 ${index + 1}`,
    body: quote,
    status: "published",
    displayOrder: 100 + index,
    updatedAt: DEFAULT_UPDATED_AT,
  }));

export const DEFAULT_HOME_COPY_ITEMS: HomeCopyItem[] = [
  {
    id: "default-hero-bubble-known",
    slot: "hero_bubble",
    variant: "default",
    title: "아기 말풍선",
    body: "{babyName}는 지금 {pregnancyWeekLabel}에 머물고 있어요. 오늘도 엄마와 연결된 시간을 기다리고 있어요.",
    status: "published",
    displayOrder: 1,
    updatedAt: DEFAULT_UPDATED_AT,
  },
  {
    id: "default-hero-bubble-unknown",
    slot: "hero_bubble",
    variant: "unknown",
    title: "아기 말풍선 - 주차 정보 없음",
    body: "엄마, 오늘도 저를 생각해주셔서 감사해요. 천천히 숨 쉬면서 함께 하루를 보내요.",
    status: "published",
    displayOrder: 2,
    updatedAt: DEFAULT_UPDATED_AT,
  },
  {
    id: "default-daily-note-calm",
    slot: "daily_note",
    variant: "차분하게",
    title: "오늘의 한마디 - 차분하게",
    body: "지금 이 순간, 깊게 숨을 들이쉬고 내쉬어 보세요. 오늘 하루도 잘 해내고 있어요.",
    status: "published",
    displayOrder: 10,
    updatedAt: DEFAULT_UPDATED_AT,
  },
  {
    id: "default-daily-note-friendly",
    slot: "daily_note",
    variant: "친근하게",
    title: "오늘의 한마디 - 친근하게",
    body: "오늘도 수고 많았어요! 아기도 엄마 옆에서 편안하게 하루를 보내고 있을 거예요.",
    status: "published",
    displayOrder: 11,
    updatedAt: DEFAULT_UPDATED_AT,
  },
  {
    id: "default-daily-note-professional",
    slot: "daily_note",
    variant: "전문적으로",
    title: "오늘의 한마디 - 전문적으로",
    body: "규칙적인 태동 확인과 충분한 수분 섭취를 유지하면 건강한 임신 경과에 도움이 됩니다.",
    status: "published",
    displayOrder: 12,
    updatedAt: DEFAULT_UPDATED_AT,
  },
  {
    id: "default-daily-note-warm",
    slot: "daily_note",
    variant: "다정하게",
    title: "오늘의 한마디 - 다정하게",
    body: "엄마가 느끼는 모든 감정은 소중해요. 오늘도 아기와 함께 따뜻한 하루 보내세요.",
    status: "published",
    displayOrder: 13,
    updatedAt: DEFAULT_UPDATED_AT,
  },
  {
    id: "default-daily-note-fallback",
    slot: "daily_note",
    variant: "default",
    title: "오늘의 한마디 - 기본",
    body: "몸이 보내는 신호를 너무 급하게 판단하지 말고, 오늘 느낀 것을 차분히 살펴봐요.",
    status: "published",
    displayOrder: 14,
    updatedAt: DEFAULT_UPDATED_AT,
  },
  ...DEFAULT_ENCOURAGEMENT_COPY_ITEMS,
];

function isHomeCopySlot(value: unknown): value is HomeCopySlot {
  return (
    typeof value === "string" && HOME_COPY_SLOTS.includes(value as HomeCopySlot)
  );
}

function isHomeCopyStatus(value: unknown): value is HomeCopyStatus {
  return (
    typeof value === "string" &&
    HOME_COPY_STATUSES.includes(value as HomeCopyStatus)
  );
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeVariant(value: unknown) {
  const trimmed = normalizeText(value);
  return trimmed ? trimmed : null;
}

function normalizeDisplayOrder(value: unknown, fallback: number) {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(numericValue) ? Math.trunc(numericValue) : fallback;
}

export function normalizeHomeCopyItemInput(
  value: unknown,
): HomeCopyItemInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const slot = record.slot;
  const title = normalizeText(record.title);
  const body = normalizeText(record.body);
  const status = record.status ?? "published";

  if (!isHomeCopySlot(slot) || !title || !body || !isHomeCopyStatus(status)) {
    return null;
  }

  return {
    slot,
    variant: normalizeVariant(record.variant),
    title,
    body,
    status,
    displayOrder:
      record.displayOrder === undefined || record.displayOrder === null
        ? null
        : normalizeDisplayOrder(record.displayOrder, 0),
  };
}

export function normalizeHomeCopyItems(value: unknown): HomeCopyItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index): HomeCopyItem | null => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const record = item as Record<string, unknown>;
      const id = normalizeText(record.id);
      const input = normalizeHomeCopyItemInput(record);
      if (!id || !input) {
        return null;
      }

      return {
        id,
        slot: input.slot,
        variant: input.variant ?? null,
        title: input.title,
        body: input.body,
        status: "published",
        displayOrder: input.displayOrder ?? index + 1,
        updatedAt: normalizeText(record.updatedAt) || new Date(0).toISOString(),
      };
    })
    .filter((item): item is HomeCopyItem => Boolean(item))
    .sort((left, right) => {
      const orderDelta = left.displayOrder - right.displayOrder;
      if (orderDelta !== 0) return orderDelta;
      return left.title.localeCompare(right.title, "ko-KR");
    });
}

export function getHomeCopyItemsForAdmin(value: unknown): HomeCopyItem[] {
  const configuredItems = normalizeHomeCopyItems(value);
  return configuredItems.length > 0
    ? configuredItems
    : [...DEFAULT_HOME_COPY_ITEMS];
}

export function getPublishedHomeCopyItems(value: unknown): HomeCopyItem[] {
  return normalizeHomeCopyItems(value).filter(
    (item) => item.status === "published",
  );
}

export function selectHomeCopyItem(
  items: HomeCopyItem[],
  slot: HomeCopySlot,
  variant?: string | null,
  seed?: string,
) {
  const slotItems = items
    .filter((item) => item.slot === slot && item.status === "published")
    .sort((left, right) => left.displayOrder - right.displayOrder);
  const normalizedVariant = variant?.trim() || null;
  const pickItem = (candidates: HomeCopyItem[]) =>
    seed ? pickHomeCopyItem(candidates, seed) : (candidates[0] ?? null);

  if (normalizedVariant) {
    const exactMatches = slotItems.filter(
      (item) => item.variant === normalizedVariant,
    );
    const exactMatch = pickItem(exactMatches);
    if (exactMatch) return exactMatch;
  }

  return (
    pickItem(slotItems.filter((item) => item.variant === "default")) ??
    pickItem(slotItems.filter((item) => !item.variant)) ??
    pickItem(slotItems)
  );
}

export function pickHomeCopyItem(items: HomeCopyItem[], seed: string) {
  if (items.length === 0) {
    return null;
  }

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return items[hash % items.length];
}

export function renderHomeCopyTemplate(
  template: string,
  variables: Record<string, string | null | undefined>,
) {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    const value = variables[key];
    return value == null ? match : value;
  });
}
