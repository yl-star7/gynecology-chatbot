/**
 * 모든 stage별 subworkflow YAML + router YAML 을 GCS 에 업로드.
 * admin 이 GCS 콘솔/엔드포인트로 편집 가능하도록.
 *
 * GCS paths are taken from WORKFLOW_YAML_DB_CATALOG.
 */

import "dotenv/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";
import fs from "node:fs";

loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import { Storage } from "@google-cloud/storage";
import {
  DEFAULT_WORKFLOW_YAML_BUCKET,
  WORKFLOW_YAML_DB_CATALOG,
} from "../packages/app-core/src/workflow-yaml-catalog";

const BUCKET = process.env.GCS_WORKFLOW_BUCKET ?? DEFAULT_WORKFLOW_YAML_BUCKET;

const WORKFLOW_LOCAL_DIR = "packages/mobile-api/src/workflows";
const UPLOADS = WORKFLOW_YAML_DB_CATALOG.map((entry) => ({
  local: path.join(WORKFLOW_LOCAL_DIR, entry.gcsObject),
  remote: entry.gcsObject,
}));

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
