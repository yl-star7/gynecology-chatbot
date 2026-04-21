/**
 * 모든 stage별 subworkflow YAML + router YAML 을 GCS 에 업로드.
 * admin 이 GCS 콘솔/엔드포인트로 편집 가능하도록.
 *
 * GCS paths:
 *   agaya-workflow-config/
 *     maternal-nursing.yaml           (기존 monolith — 폴백)
 *     maternal-nursing-router.yaml    (router)
 *     subworkflows/
 *       baby-info.yaml
 *       letter-reflection.yaml
 *       free-chat.yaml
 *       general.yaml
 */

import "dotenv/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";
import fs from "node:fs";

loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import { Storage } from "@google-cloud/storage";

const BUCKET = process.env.GCS_WORKFLOW_BUCKET ?? "agaya-workflow-config";

const UPLOADS = [
  {
    local: "packages/mobile-api/src/workflows/maternal-nursing.yaml",
    remote: "maternal-nursing.yaml",
  },
  {
    local: "packages/mobile-api/src/workflows/maternal-nursing-router.yaml",
    remote: "maternal-nursing-router.yaml",
  },
  {
    local: "packages/mobile-api/src/workflows/subworkflows/baby-info.yaml",
    remote: "subworkflows/baby-info.yaml",
  },
  {
    local:
      "packages/mobile-api/src/workflows/subworkflows/letter-reflection.yaml",
    remote: "subworkflows/letter-reflection.yaml",
  },
  {
    local: "packages/mobile-api/src/workflows/subworkflows/free-chat.yaml",
    remote: "subworkflows/free-chat.yaml",
  },
  {
    local: "packages/mobile-api/src/workflows/subworkflows/general.yaml",
    remote: "subworkflows/general.yaml",
  },
];

async function main() {
  const storage = new Storage({
    projectId:
      process.env.GCS_PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      undefined,
  });
  const bucket = storage.bucket(BUCKET);
  for (const { local, remote } of UPLOADS) {
    const full = path.resolve(process.cwd(), local);
    if (!fs.existsSync(full)) {
      console.warn(`[skip] ${local} — file not found`);
      continue;
    }
    const body = fs.readFileSync(full);
    await bucket.file(remote).save(body, {
      resumable: false,
      contentType: "text/yaml",
      validation: false,
    });
    console.log(
      `[upload] ${body.byteLength.toString().padStart(6)}B → gs://${BUCKET}/${remote}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
