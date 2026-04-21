import type { LinkTargetContent } from "@gynecology-chatbot/app-core";

export type LinkKnowledgeRow = {
  title: string;
  section: string;
  body: string;
};

export type LinkPregnancyDocumentRow = {
  title: string | null;
  content: string;
  category: string;
  pregnancy_week: number | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidEntityId(value: string | null | undefined) {
  return Boolean(value && UUID_PATTERN.test(value.trim()));
}

export function buildKnowledgeLinkContent(
  row: LinkKnowledgeRow,
): LinkTargetContent {
  return {
    title: row.title,
    section: row.section,
    body: row.body,
  };
}

export function buildPregnancyDocumentLinkContent(
  row: LinkPregnancyDocumentRow,
): LinkTargetContent {
  return {
    title: row.title?.trim() || "임신 정보",
    section:
      row.pregnancy_week !== null
        ? `${row.pregnancy_week}주 정보`
        : row.category,
    body: row.content,
  };
}
