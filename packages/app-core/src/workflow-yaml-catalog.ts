import type { AdminWorkflowRule } from "./domain";

export const DEFAULT_WORKFLOW_YAML_BUCKET = "agaya-workflow-config";

export type AdminWorkflowYamlCatalogEntry = {
  slug: string;
  name: string;
  kind: NonNullable<AdminWorkflowRule["workflowKind"]>;
  trigger: string;
  retrievalScope: string;
  modelName: string;
  gcsObject: string;
  status: AdminWorkflowRule["status"];
};

export const ADMIN_WORKFLOW_YAML_CATALOG: AdminWorkflowYamlCatalogEntry[] = [
  {
    slug: "maternal-nursing-router",
    name: "모성간호 router (stage 분기)",
    kind: "router",
    trigger: "stage router",
    retrievalScope: "stage 기반 subworkflow 라우팅",
    modelName: "gemini-2.5-flash-lite",
    gcsObject: "maternal-nursing-router.yaml",
    status: "active",
  },
  {
    slug: "maternal-nursing-baby-info",
    name: "모성간호 baby_info (주차 정보 요약)",
    kind: "subworkflow",
    trigger: "stage=0 baby_info",
    retrievalScope: "임신백과 주차 정보",
    modelName: "gemini-2.5-flash-lite",
    gcsObject: "subworkflows/baby-info.yaml",
    status: "active",
  },
  {
    slug: "maternal-nursing-letter-reflection",
    name: "모성간호 letter_reflection (편지/공감 대화)",
    kind: "subworkflow",
    trigger: "stage=2 letter_reflection",
    retrievalScope: "오늘 질문 답변 맥락",
    modelName: "gemini-2.5-flash-lite",
    gcsObject: "subworkflows/letter-reflection.yaml",
    status: "active",
  },
  {
    slug: "maternal-nursing-free-chat",
    name: "모성간호 free_chat (자유 대화)",
    kind: "subworkflow",
    trigger: "stage=free_chat",
    retrievalScope: "자유 대화",
    modelName: "gemini-2.5-flash-lite",
    gcsObject: "subworkflows/free-chat.yaml",
    status: "active",
  },
  {
    slug: "maternal-nursing-general",
    name: "모성간호 general (폴백)",
    kind: "subworkflow",
    trigger: "fallback/general",
    retrievalScope: "일반 상담 폴백",
    modelName: "gemini-2.5-flash-lite",
    gcsObject: "subworkflows/general.yaml",
    status: "active",
  },
];

export const RUNTIME_WORKFLOW_YAML_ENTRY: AdminWorkflowYamlCatalogEntry = {
  slug: "maternal-nursing-monolith",
  name: "모성간호 monolith (채팅 런타임)",
  kind: "monolith",
  trigger: "mobile chat runtime",
  retrievalScope: "모바일 채팅 런타임 YAML",
  modelName: "gemini-2.5-flash-lite",
  gcsObject: "maternal-nursing.yaml",
  status: "active",
};

export const WORKFLOW_YAML_DB_CATALOG: AdminWorkflowYamlCatalogEntry[] = [
  RUNTIME_WORKFLOW_YAML_ENTRY,
  ...ADMIN_WORKFLOW_YAML_CATALOG,
];

export function buildWorkflowYamlStoragePath(
  gcsObject: string,
  bucket = DEFAULT_WORKFLOW_YAML_BUCKET,
) {
  return `gs://${bucket}/${gcsObject}`;
}

export function buildAdminWorkflowYamlCatalog(
  bucket = DEFAULT_WORKFLOW_YAML_BUCKET,
): AdminWorkflowRule[] {
  return ADMIN_WORKFLOW_YAML_CATALOG.map((entry) => ({
    id: `yaml:${entry.slug}`,
    name: entry.name,
    trigger: entry.trigger,
    retrievalScope: entry.retrievalScope,
    modelName: entry.modelName,
    status: entry.status,
    source: "gcs-yaml",
    workflowKind: entry.kind,
    storagePath: buildWorkflowYamlStoragePath(entry.gcsObject, bucket),
    gcsBucket: bucket,
    gcsObject: entry.gcsObject,
    sqlSlug: entry.slug,
  }));
}

function hasEditableYamlKind(rule: AdminWorkflowRule) {
  return (
    rule.workflowKind === "monolith" ||
    rule.workflowKind === "router" ||
    rule.workflowKind === "subworkflow"
  );
}

export function orderDbWorkflowRulesByYamlCatalog(
  rules: AdminWorkflowRule[],
): AdminWorkflowRule[] {
  const catalogSlugOrder = new Map(
    WORKFLOW_YAML_DB_CATALOG.map((entry, index) => [entry.slug, index]),
  );
  const candidates = rules.filter(
    (rule) =>
      Boolean(rule.storagePath) &&
      ((rule.sqlSlug && catalogSlugOrder.has(rule.sqlSlug)) ||
        hasEditableYamlKind(rule)),
  );
  const seenIds = new Set<string>();
  const ordered: AdminWorkflowRule[] = [];

  for (const entry of WORKFLOW_YAML_DB_CATALOG) {
    const rule = candidates.find(
      (candidate) => candidate.sqlSlug === entry.slug,
    );
    if (rule && !seenIds.has(rule.id)) {
      ordered.push(rule);
      seenIds.add(rule.id);
    }
  }

  for (const rule of candidates) {
    if (seenIds.has(rule.id)) continue;
    ordered.push(rule);
    seenIds.add(rule.id);
  }

  return ordered;
}
