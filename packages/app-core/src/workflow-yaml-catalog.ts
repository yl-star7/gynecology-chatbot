import type { AdminWorkflowRule } from "./domain";

export const DEFAULT_WORKFLOW_YAML_BUCKET = "agaya-workflow-config";
export const ADMIN_WORKFLOW_MODEL_NAME = "gemini-3.1-flash-lite";

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
    name: "대화 단계 분류",
    kind: "router",
    trigger: "대화 단계 선택",
    retrievalScope: "주차 정보, 공감 대화, 자유 상담 분기",
    modelName: ADMIN_WORKFLOW_MODEL_NAME,
    gcsObject: "maternal-nursing-router.yaml",
    status: "active",
  },
  {
    slug: "maternal-nursing-baby-info",
    name: "주차 정보 답변",
    kind: "subworkflow",
    trigger: "주차 정보 요청",
    retrievalScope: "임신백과 주차 정보",
    modelName: ADMIN_WORKFLOW_MODEL_NAME,
    gcsObject: "subworkflows/baby-info.yaml",
    status: "active",
  },
  {
    slug: "maternal-nursing-letter-reflection",
    name: "오늘 질문 공감 답변",
    kind: "subworkflow",
    trigger: "오늘 질문 답변 중",
    retrievalScope: "질문 답변과 대화 맥락",
    modelName: ADMIN_WORKFLOW_MODEL_NAME,
    gcsObject: "subworkflows/letter-reflection.yaml",
    status: "active",
  },
  {
    slug: "maternal-nursing-free-chat",
    name: "자유 상담",
    kind: "subworkflow",
    trigger: "질문 완료 후 자유 대화",
    retrievalScope: "최근 대화 맥락",
    modelName: ADMIN_WORKFLOW_MODEL_NAME,
    gcsObject: "subworkflows/free-chat.yaml",
    status: "active",
  },
  {
    slug: "maternal-nursing-general",
    name: "기본 안내/응급 신호",
    kind: "subworkflow",
    trigger: "분류가 애매한 질문",
    retrievalScope: "일반 상담 안전장치",
    modelName: ADMIN_WORKFLOW_MODEL_NAME,
    gcsObject: "subworkflows/general.yaml",
    status: "active",
  },
];

export const RUNTIME_WORKFLOW_YAML_ENTRY: AdminWorkflowYamlCatalogEntry = {
  slug: "maternal-nursing-monolith",
  name: "기본 상담 흐름",
  kind: "monolith",
  trigger: "앱 채팅 시작",
  retrievalScope: "모바일 채팅 전체 흐름",
  modelName: ADMIN_WORKFLOW_MODEL_NAME,
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
