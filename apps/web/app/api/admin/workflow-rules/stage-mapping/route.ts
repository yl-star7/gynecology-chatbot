/**
 * stage → Schift workflow ID 매핑 관리.
 *
 * 저장 위치: system_config 테이블 (key='workflow_stage_mapping').
 * - GET: 현재 매핑 조회
 * - PUT: 매핑 저장 (body: { baby_info, letter_reflection, free_chat, general })
 *
 * 서버 chat route 가 이 매핑을 읽어 stage 에 맞는 workflow 를 호출.
 */

import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@gynecology-chatbot/db/prisma";
import { prisma } from "@gynecology-chatbot/db/prisma";

import { readAdminSessionUser } from "@/lib/admin/auth";

const CONFIG_KEY = "workflow_stage_mapping";

type Mapping = {
  baby_info: string | null;
  letter_reflection: string | null;
  free_chat: string | null;
  general: string | null;
  /** router 는 선택적 (Schift 서브워크플로우 router 활성 시) */
  router?: string | null;
};

function defaultsFromEnv(): Mapping {
  return {
    baby_info: process.env.SCHIFT_WF_BABY_INFO ?? null,
    letter_reflection: process.env.SCHIFT_WF_LETTER_REFLECTION ?? null,
    free_chat: process.env.SCHIFT_WF_FREE_CHAT ?? null,
    general: process.env.SCHIFT_WF_GENERAL ?? null,
    router: process.env.SCHIFT_WF_ROUTER ?? null,
  };
}

function sanitize(input: unknown): Mapping {
  const defaults = defaultsFromEnv();
  if (!input || typeof input !== "object") return defaults;
  const obj = input as Record<string, unknown>;
  const pick = (k: keyof Mapping): string | null => {
    const v = obj[k];
    return typeof v === "string" && v.trim() ? v.trim() : (defaults[k] ?? null);
  };
  return {
    baby_info: pick("baby_info"),
    letter_reflection: pick("letter_reflection"),
    free_chat: pick("free_chat"),
    general: pick("general"),
    router: pick("router"),
  };
}

export async function GET() {
  const admin = await readAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const row = await prisma.system_config.findUnique({
    where: { key: CONFIG_KEY },
    select: { value: true, updated_at: true },
  });
  const stored = row?.value
    ? sanitize(row.value as unknown)
    : defaultsFromEnv();
  return NextResponse.json({
    mapping: stored,
    source: row?.value ? "db" : "env",
    updatedAt: row?.updated_at ?? null,
    envDefaults: defaultsFromEnv(),
  });
}

export async function PUT(request: NextRequest) {
  const admin = await readAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const next = sanitize(body);
  await prisma.system_config.upsert({
    where: { key: CONFIG_KEY },
    create: {
      key: CONFIG_KEY,
      value: next as unknown as Prisma.InputJsonValue,
    },
    update: {
      value: next as unknown as Prisma.InputJsonValue,
      updated_at: new Date(),
    },
  });
  return NextResponse.json({ ok: true, mapping: next });
}
