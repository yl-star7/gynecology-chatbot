/**
 * 관리자용 subworkflow YAML 읽기/쓰기.
 *
 * GET  /api/admin/workflow-rules/subworkflows/{name}   → GCS 에서 읽어 YAML 반환
 * PUT  /api/admin/workflow-rules/subworkflows/{name}   → body(YAML text) 를 GCS 에 저장
 *
 * name ∈ { baby-info, letter-reflection, free-chat, general, router }
 * router 는 특수 경로(maternal-nursing-router.yaml) 에 저장.
 */

import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";

import { readAdminSessionUser } from "@/lib/admin/auth";

const BUCKET = process.env.GCS_WORKFLOW_BUCKET ?? "agaya-workflow-config";

function getStorage(): Storage {
  return new Storage({
    projectId:
      process.env.GCS_PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      undefined,
  });
}

function resolvePath(name: string): string | null {
  if (name === "router") return "maternal-nursing-router.yaml";
  if (name === "monolith") return "maternal-nursing.yaml";
  const allowed = ["baby-info", "letter-reflection", "free-chat", "general"];
  if (!allowed.includes(name)) return null;
  return `subworkflows/${name}.yaml`;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  const admin = await readAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { name } = await context.params;
  const remotePath = resolvePath(name);
  if (!remotePath) {
    return NextResponse.json(
      { error: `unknown subworkflow: ${name}` },
      { status: 400 },
    );
  }
  try {
    const [buffer] = await getStorage()
      .bucket(BUCKET)
      .file(remotePath)
      .download();
    return new NextResponse(buffer.toString("utf-8"), {
      headers: { "Content-Type": "text/yaml; charset=utf-8" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to read subworkflow yaml",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  const admin = await readAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { name } = await context.params;
  const remotePath = resolvePath(name);
  if (!remotePath) {
    return NextResponse.json(
      { error: `unknown subworkflow: ${name}` },
      { status: 400 },
    );
  }
  const body = await request.text();
  if (!body.trim()) {
    return NextResponse.json({ error: "empty body" }, { status: 400 });
  }
  // 간단한 YAML 검증 — name/blocks/edges 키 존재 확인
  if (!/^name:/m.test(body) || !/^blocks:/m.test(body)) {
    return NextResponse.json(
      { error: "invalid yaml: missing name/blocks" },
      { status: 400 },
    );
  }
  try {
    await getStorage().bucket(BUCKET).file(remotePath).save(body, {
      resumable: false,
      contentType: "text/yaml",
      validation: false,
    });
    return NextResponse.json({
      ok: true,
      path: `gs://${BUCKET}/${remotePath}`,
      bytes: body.length,
      savedAt: new Date().toISOString(),
      note: "Schift 에도 반영하려면 /api/admin/workflow-rules/subworkflows/sync-schift 호출",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to save subworkflow yaml",
      },
      { status: 500 },
    );
  }
}
