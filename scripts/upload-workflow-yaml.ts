/**
 * 모성간호 상담 워크플로우 YAML을 GCS(`agaya-workflow-config` bucket)에 업로드하고,
 * admin refresh 엔드포인트를 호출해 서버 캐시를 즉시 갱신한다.
 *
 * Usage:
 *   pnpm tsx scripts/upload-workflow-yaml.ts
 *   pnpm tsx scripts/upload-workflow-yaml.ts --skip-refresh
 *   ADMIN_REFRESH_URL=https://.../api/admin/workflow-rules/refresh-yaml \
 *   ADMIN_SESSION_COOKIE="si_admin=..." pnpm tsx scripts/upload-workflow-yaml.ts
 *
 * 필요한 환경변수:
 *   GCS_PROJECT_ID 또는 GOOGLE_CLOUD_PROJECT
 *   (선택) ADMIN_REFRESH_URL — 기본 http://localhost:3005/api/admin/workflow-rules/refresh-yaml
 *   (선택) ADMIN_SESSION_COOKIE — admin 세션 쿠키 (없으면 refresh 스킵)
 */

import fs from "node:fs";
import path from "node:path";
import { Storage } from "@google-cloud/storage";

const BUCKET = process.env.GCS_WORKFLOW_BUCKET ?? "agaya-workflow-config";
const OBJECT_PATH = "maternal-nursing.yaml";
const YAML_PATH = path.resolve(
  __dirname,
  "../packages/mobile-api/src/workflows/maternal-nursing.yaml",
);

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`[upload-workflow-yaml] ${name} is required`);
    process.exit(1);
  }
  return value;
}

function getErrorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error
    ? (error as { code?: unknown }).code
    : null;
}

async function uploadToStorage(): Promise<void> {
  if (!fs.existsSync(YAML_PATH)) {
    console.error(`[upload-workflow-yaml] file not found: ${YAML_PATH}`);
    process.exit(1);
  }

  const body = fs.readFileSync(YAML_PATH);
  const storage = new Storage({
    projectId:
      process.env.GCS_PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      undefined,
  });
  const bucket = storage.bucket(BUCKET);
  try {
    const [exists] = await bucket.exists();
    if (!exists) {
      await bucket.create();
    }
  } catch (error) {
    if (getErrorCode(error) !== 403) {
      throw error;
    }
    console.warn(
      "[upload-workflow-yaml] bucket existence check denied — attempting object upload to existing bucket",
    );
  }
  await bucket.file(OBJECT_PATH).save(body, {
    resumable: false,
    contentType: "text/yaml",
    validation: false,
  });

  console.log(
    `[upload-workflow-yaml] uploaded ${body.byteLength} bytes → gs://${BUCKET}/${OBJECT_PATH}`,
  );
}

async function refreshAdminCache(): Promise<void> {
  const refreshUrl =
    process.env.ADMIN_REFRESH_URL ??
    "http://localhost:3005/api/admin/workflow-rules/refresh-yaml";
  const cookie = process.env.ADMIN_SESSION_COOKIE;

  if (!cookie) {
    console.log(
      "[upload-workflow-yaml] ADMIN_SESSION_COOKIE 미설정 — refresh 스킵 (5분 TTL 경과 시 자동 반영)",
    );
    return;
  }

  const res = await fetch(refreshUrl, {
    method: "POST",
    headers: { Cookie: cookie },
  });

  if (!res.ok) {
    const text = await res.text();
    console.warn(
      `[upload-workflow-yaml] refresh failed (${res.status}): ${text}`,
    );
    return;
  }

  const result = (await res.json()) as {
    name?: string;
    blockCount?: number;
    refreshedAt?: string;
  };
  console.log(
    `[upload-workflow-yaml] refreshed: name="${result.name}" blocks=${result.blockCount} at ${result.refreshedAt}`,
  );
}

async function main() {
  const skipRefresh = process.argv.includes("--skip-refresh");
  await uploadToStorage();
  if (!skipRefresh) {
    await refreshAdminCache();
  }
}

main().catch((error) => {
  console.error("[upload-workflow-yaml] failed", error);
  process.exit(1);
});
