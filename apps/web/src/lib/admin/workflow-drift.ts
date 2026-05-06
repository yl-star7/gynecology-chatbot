import { createHash } from "node:crypto";

import { Storage } from "@google-cloud/storage";
import { RUNTIME_WORKFLOW_YAML_ENTRY } from "@gynecology-chatbot/app-core";
import { prisma } from "@gynecology-chatbot/db/prisma";

import { resolveAdminWorkflowYamlLocation } from "@/lib/admin/workflow-yaml-location";
import { listSchiftWorkflows } from "@/lib/mobile/schift-workflows-api";

export interface WorkflowDriftReport {
  yamlSha: string | null;
  yamlModifiedAt: string | null;
  dbVersion: string | null;
  dbUpdatedAt: string | null;
  schiftStatus: string | null;
  schiftWorkflowId: string | null;
  drift: boolean;
  reasons: string[];
  available: boolean;
  message: string | null;
}

export interface WorkflowDriftInputs {
  yamlSha: string | null;
  dbVersion: string | null;
  schiftStatus: string | null;
  schiftAvailable: boolean;
}

/**
 * 순수 계산 함수: 3층 상태를 받아 드리프트 여부와 이유를 반환합니다.
 * 본 함수는 I/O 없이 동작하여 단위 테스트가 쉽도록 분리되어 있습니다.
 */
export function computeWorkflowDrift(inputs: WorkflowDriftInputs): {
  drift: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (!inputs.yamlSha) {
    reasons.push("YAML 소스 SHA 를 읽을 수 없습니다.");
  }
  if (!inputs.dbVersion) {
    reasons.push("workflow_definitions 에 최신 버전이 없습니다.");
  }
  if (!inputs.schiftAvailable) {
    reasons.push("Schift 런타임 상태를 확인할 수 없습니다.");
  }
  if (inputs.schiftAvailable && !inputs.schiftStatus) {
    reasons.push("Schift 런타임에 등록된 워크플로우가 없습니다.");
  }

  if (
    inputs.yamlSha &&
    inputs.dbVersion &&
    inputs.schiftAvailable &&
    inputs.schiftStatus &&
    inputs.yamlSha !== inputs.dbVersion
  ) {
    reasons.push(
      `YAML SHA 와 DB 버전이 일치하지 않습니다 (yaml=${inputs.yamlSha.slice(0, 8)}, db=${inputs.dbVersion}).`,
    );
  }

  return {
    drift: reasons.length > 0,
    reasons,
  };
}

function getStorage() {
  return new Storage({
    projectId:
      process.env.GCS_PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      undefined,
  });
}

async function readYamlSourceStatus(): Promise<{
  sha: string | null;
  modifiedAt: string | null;
}> {
  try {
    const location = await resolveAdminWorkflowYamlLocation("monolith");
    if (!location) return { sha: null, modifiedAt: null };
    const file = getStorage().bucket(location.bucket).file(location.objectPath);
    const [[buffer], [metadata]] = await Promise.all([
      file.download(),
      file.getMetadata(),
    ]);
    return {
      sha: createHash("sha256").update(buffer).digest("hex"),
      modifiedAt:
        typeof metadata.updated === "string" ? metadata.updated : null,
    };
  } catch {
    return { sha: null, modifiedAt: null };
  }
}

async function readLatestDbWorkflow(): Promise<{
  version: string | null;
  updatedAt: string | null;
}> {
  try {
    const row = await prisma.workflow_definitions.findFirst({
      where: {
        provider: "gcs-yaml",
        slug: RUNTIME_WORKFLOW_YAML_ENTRY.slug,
      },
      orderBy: { updated_at: "desc" },
    });
    if (!row) return { version: null, updatedAt: null };
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    const versionFromMetadata =
      typeof metadata.yamlSha === "string"
        ? metadata.yamlSha
        : typeof metadata.version === "string"
        ? metadata.version
        : typeof metadata.git_sha === "string"
          ? metadata.git_sha
          : null;
    const version =
      versionFromMetadata ?? row.updated_at?.toISOString() ?? row.id;
    return {
      version,
      updatedAt: row.updated_at?.toISOString() ?? null,
    };
  } catch {
    return { version: null, updatedAt: null };
  }
}

interface SchiftRuntimeStatus {
  status: string | null;
  workflowId: string | null;
  available: boolean;
  message: string | null;
}

async function readSchiftRuntimeStatus(): Promise<SchiftRuntimeStatus> {
  try {
    const workflows = await listSchiftWorkflows();
    const target =
      workflows.find((wf) =>
        (wf.name ?? "").toLowerCase().includes("maternal"),
      ) ?? workflows[0];
    if (!target) {
      return {
        status: null,
        workflowId: null,
        available: true,
        message: "Schift 런타임에 워크플로우가 없습니다.",
      };
    }
    const maybeStatus =
      (target as { status?: string | null }).status ??
      (target as { state?: string | null }).state ??
      "active";
    return {
      status: maybeStatus ?? "active",
      workflowId: target.id ?? null,
      available: true,
      message: null,
    };
  } catch (error) {
    return {
      status: null,
      workflowId: null,
      available: false,
      message:
        error instanceof Error
          ? `Schift 런타임 조회 실패: ${error.message}`
          : "Schift 런타임 조회 실패",
    };
  }
}

export async function loadWorkflowDrift(): Promise<WorkflowDriftReport> {
  const [yamlSource, db, schift] = await Promise.all([
    readYamlSourceStatus(),
    readLatestDbWorkflow(),
    readSchiftRuntimeStatus(),
  ]);

  const { drift, reasons } = computeWorkflowDrift({
    yamlSha: yamlSource.sha,
    dbVersion: db.version,
    schiftStatus: schift.status,
    schiftAvailable: schift.available,
  });

  return {
    yamlSha: yamlSource.sha,
    yamlModifiedAt: yamlSource.modifiedAt,
    dbVersion: db.version,
    dbUpdatedAt: db.updatedAt,
    schiftStatus: schift.status,
    schiftWorkflowId: schift.workflowId,
    drift,
    reasons,
    available: schift.available,
    message: schift.message,
  };
}

export const __testing__ = {
  readYamlSourceStatus,
  readLatestDbWorkflow,
};
