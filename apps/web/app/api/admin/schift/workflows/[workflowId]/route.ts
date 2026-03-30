import { NextRequest, NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { getSchiftClient } from "@/lib/mobile/schift-client";
import { patchSchiftWorkflow } from "@/lib/mobile/schift-workflows-api";

type Ctx = { params: Promise<{ workflowId: string }> };

/**
 * Schift API는 graph PATCH로 nodes를 영속하지 않는 버그가 있다.
 * nodes가 비어있으면 edges의 source/target에서 블록을 재구성하고,
 * graph.nodes → graph.blocks 동기화도 처리한다.
 */
function normalizeGraph(data: Record<string, unknown>): Record<string, unknown> {
  const graph = data.graph as Record<string, unknown> | undefined;
  if (!graph) return data;

  let blocks = (graph.nodes ?? graph.blocks ?? []) as Record<string, unknown>[];

  // Schift API가 nodes를 저장 못 하는 경우 edges에서 블록 구조 복원
  if (blocks.length === 0) {
    const edges = (graph.edges ?? []) as Record<string, unknown>[];
    const blockIds = new Set<string>();
    for (const edge of edges) {
      if (edge.source) blockIds.add(edge.source as string);
      if (edge.target) blockIds.add(edge.target as string);
    }

    const typeMap: Record<string, string> = {
      start: "start",
      retriever: "retriever",
      prompt_template: "prompt_template",
      llm: "llm",
      answer: "answer",
      end: "end",
    };

    const titleMap: Record<string, string> = {
      start: "사용자 질문 입력",
      retriever: "임신 지식 검색",
      prompt_template: "교수자 감수 프롬프트",
      llm: "LLM 응답 생성",
      answer: "JSON 응답 포맷",
      end: "종료",
    };

    const configMap: Record<string, Record<string, unknown>> = {
      retriever: { collection: "pregnancy-knowledge", top_k: 8 },
      llm: { model: "gemini-2.5-flash-lite", temperature: 0.1, max_tokens: 1024 },
      answer: { format: "json", include_sources: true },
    };

    let y = 0;
    blocks = Array.from(blockIds).map((id) => {
      const block = {
        id,
        type: typeMap[id] ?? id,
        title: titleMap[id] ?? id,
        position: { x: 250, y },
        config: configMap[id] ?? {},
      };
      y += 150;
      return block;
    });
  }

  return {
    ...data,
    graph: {
      ...graph,
      blocks,
      nodes: blocks,
    },
  };
}

/** GET /api/admin/schift/workflows/:id — get workflow detail (with graph) */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const admin = await readAdminSessionUser();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const schift = getSchiftClient();
  if (!schift) return NextResponse.json({ error: "SCHIFT_API_KEY not configured" }, { status: 503 });

  try {
    const { workflowId } = await ctx.params;
    const workflow = await schift.workflows.get(workflowId);
    const plain = JSON.parse(JSON.stringify(workflow)) as Record<string, unknown>;
    return NextResponse.json(normalizeGraph(plain));
  } catch (error) {
    const msg = error instanceof Error ? error.message : "failed";
    const status = msg.includes("404") ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

/** PATCH /api/admin/schift/workflows/:id — update workflow */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  const admin = await readAdminSessionUser();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { workflowId } = await ctx.params;
    const body = (await request.json()) as Record<string, unknown>;

    // graph가 포함된 PATCH는 blocks/nodes를 graph에서 제외하고 메타만 업데이트
    // (Schift API가 graph.nodes PATCH를 영속하지 않아서 graph 전체를 보내면 nodes가 초기화됨)
    const { graph: _graph, ...rest } = body;
    const result = await patchSchiftWorkflow(workflowId, rest);
    const plain = JSON.parse(JSON.stringify(result)) as Record<string, unknown>;
    return NextResponse.json(normalizeGraph(plain));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}

/** DELETE /api/admin/schift/workflows/:id — delete workflow */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const admin = await readAdminSessionUser();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const schift = getSchiftClient();
  if (!schift) return NextResponse.json({ error: "SCHIFT_API_KEY not configured" }, { status: 503 });

  try {
    const { workflowId } = await ctx.params;
    await schift.workflows.delete(workflowId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}
