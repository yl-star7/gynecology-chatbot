import "dotenv/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

import { createDefaultInternalAnswerWorkflow } from "../packages/mobile-api/src/schift-workflows-api";
import {
  loadMaternalNursingWorkflow,
  refreshWorkflowFromStorage,
} from "../packages/mobile-api/src/workflows/load-workflow-yaml";

async function main() {
  const wf =
    (await refreshWorkflowFromStorage()) ?? loadMaternalNursingWorkflow();
  const result = await createDefaultInternalAnswerWorkflow(wf);
  console.log({
    id: result.id,
    name: result.name,
    status: result.status,
    blockCount:
      (result.graph as any).blocks?.length ??
      (result.graph as any).nodes?.length,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
