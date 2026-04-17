/**
 * 모성간호 상담 워크플로우 YAML을 Supabase Storage(`workflow-config` bucket)에 업로드하고,
 * admin refresh 엔드포인트를 호출해 서버 캐시를 즉시 갱신한다.
 *
 * Usage:
 *   pnpm tsx scripts/upload-workflow-yaml.ts
 *   pnpm tsx scripts/upload-workflow-yaml.ts --skip-refresh
 *   ADMIN_REFRESH_URL=https://.../api/admin/workflow-rules/refresh-yaml \
 *   ADMIN_SESSION_COOKIE="si_admin=..." pnpm tsx scripts/upload-workflow-yaml.ts
 *
 * 필요한 환경변수:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   (선택) ADMIN_REFRESH_URL — 기본 http://localhost:3005/api/admin/workflow-rules/refresh-yaml
 *   (선택) ADMIN_SESSION_COOKIE — admin 세션 쿠키 (없으면 refresh 스킵)
 */

import fs from "node:fs";
import path from "node:path";

const BUCKET = "workflow-config";
const OBJECT_PATH = "maternal-nursing.yaml";
const YAML_PATH = path.resolve(
  __dirname,
  "../apps/web/src/lib/mobile/workflows/maternal-nursing.yaml",
);

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`[upload-workflow-yaml] ${name} is required`);
    process.exit(1);
  }
  return value;
}

async function uploadToStorage(): Promise<void> {
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!fs.existsSync(YAML_PATH)) {
    console.error(`[upload-workflow-yaml] file not found: ${YAML_PATH}`);
    process.exit(1);
  }

  const body = fs.readFileSync(YAML_PATH);
  const url = `${supabaseUrl}/storage/v1/object/${BUCKET}/${OBJECT_PATH}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "text/yaml",
      "x-upsert": "true",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`storage upload failed (${res.status}): ${text}`);
  }

  const result = (await res.json()) as { Key?: string };
  console.log(
    `[upload-workflow-yaml] uploaded ${body.byteLength} bytes → ${result.Key ?? `${BUCKET}/${OBJECT_PATH}`}`,
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
