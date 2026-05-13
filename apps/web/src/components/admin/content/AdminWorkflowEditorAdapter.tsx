"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  BLOCK_TYPES,
  WorkflowEditorProvider,
  WorkflowBuilder,
  type BlockTypeDefinition,
  type WorkflowEditorAPI,
} from "@schift-io/sdk/workflow-editor";
import type { Workflow, WorkflowRun } from "@schift-io/sdk";

const AGAYA_WORKFLOW_BLOCKS: BlockTypeDefinition[] = [
  {
    type: "workflow_settings",
    label: "전역 설정",
    category: "Control",
    icon: "설",
    defaultConfig: {},
    inputs: [],
    outputs: [],
  },
];

const EDITOR_TEXT_REPLACEMENTS: Record<string, string> = {
  "← Back": "← 목록",
  Back: "목록",
  "Loading workflow...": "워크플로우 불러오는 중...",
  "&orarr;": "",
  Blocks: "블록",
  Control: "제어",
  Trigger: "트리거",
  Document: "문서",
  Embedding: "임베딩",
  Storage: "저장",
  Retrieval: "검색",
  RAG: "RAG",
  LLM: "LLM",
  Agent: "에이전트",
  Logic: "분기",
  Transform: "변환",
  HITL: "검토",
  Integration: "연동",
  starter: "시작",
  "First run": "처음 실행",
  "1. Start with `Start`, `Document Loader`, or `LLM`.":
    "1. 시작 블록에서 흐름을 만듭니다.",
  "2. Drop the block anywhere on the canvas.": "2. 블록을 캔버스에 놓습니다.",
  "3. Click an output circle, then an input circle to connect.":
    "3. 오른쪽 포트와 왼쪽 포트를 이어줍니다.",
  "4. Click any block to edit its config on the right.":
    "4. 블록을 누르면 오른쪽에서 설정합니다.",
  Start: "시작",
  End: "종료",
  "Manual Trigger": "수동 실행",
  "Schedule Trigger": "예약 실행",
  Wait: "대기",
  "Document Loader": "문서 불러오기",
  "Document Parser": "문서 읽기",
  Chunker: "문서 나누기",
  Embedder: "임베딩",
  "Model Selector": "모델 선택",
  "Vector Store": "벡터 저장",
  Collection: "컬렉션",
  Retriever: "검색기",
  Reranker: "재정렬",
  "Decision Review": "근거 검토",
  "Prompt Template": "프롬프트",
  Answer: "답변",
  Condition: "조건",
  Switch: "스위치",
  Router: "라우터",
  "AI Router": "AI 라우터",
  Loop: "반복",
  Merge: "합치기",
  Set: "값 설정",
  Filter: "필터",
  Aggregate: "집계",
  Sort: "정렬",
  Limit: "제한",
  "Split Out": "분리",
  Summarize: "요약",
  "Remove Duplicates": "중복 제거",
  DateTime: "날짜",
  Code: "코드",
  Variable: "변수",
  "Field Selector": "필드 선택",
  "Metadata Extractor": "메타데이터",
  "Human Approval": "사람 승인",
  "Human Form": "입력 폼",
  "HTTP Request": "HTTP 요청",
  Webhook: "웹훅",
  "YAML 전역 설정": "전역 설정",
  workflow_settings: "워크플로우 설정",
  "Unsaved changes": "저장 안 됨",
  Validate: "검사",
  "Checking…": "검사 중…",
  Save: "저장",
  "Saving…": "저장 중…",
  Saved: "저장됨",
  Error: "오류",
  Run: "실행",
  Running: "실행 중",
  Success: "성공",
  "Pick a block to configure it": "블록을 선택하면 설정이 열립니다",
  "Quick guide": "빠른 안내",
  "Click a block once to open its settings here.":
    "블록을 누르면 이 영역에서 값을 바꿀 수 있습니다.",
  "Use the right-side port on one block, then the left-side port on another to connect them.":
    "오른쪽 포트에서 시작해 다른 블록의 왼쪽 포트로 연결합니다.",
  "Deleting a block also removes any edges attached to it.":
    "블록을 삭제하면 연결선도 함께 삭제됩니다.",
  Title: "이름",
  Position: "위치",
  "Next step": "다음 단계",
  "Edit this block here, then connect its right-side outputs to another block's left-side inputs on the canvas.":
    "값을 확인한 뒤 캔버스에서 다음 블록으로 연결합니다.",
  Configuration: "설정",
  Ports: "포트",
  Inputs: "입력",
  Outputs: "출력",
  "Leave builder?": "편집기를 나갈까요?",
  "You have unsaved workflow changes. Save first if you want to keep the latest block layout and connections.":
    "저장하지 않은 변경이 있습니다. 최신 블록 배치와 연결을 유지하려면 먼저 저장하세요.",
  "Stay here": "계속 편집",
  "Save first": "먼저 저장",
  "Leave without saving": "저장 안 하고 나가기",
};

const EDITOR_ATTRIBUTE_REPLACEMENTS: Record<string, string> = {
  "Search... (e.g. router, dedupe, http)": "블록 검색",
  "Search blocks": "블록 검색",
  "Click to rename": "이름 바꾸기",
  "Undo (Ctrl+Z)": "되돌리기",
  "Redo (Ctrl+Shift+Z)": "다시 실행",
  "Add sticky note": "메모 추가",
  "Close panel": "패널 닫기",
};

const WORKFLOW_EDITOR_POLISH = `
.schift-editor-root {
  height: 100%;
  min-height: 0;
  color-scheme: dark;
  font-family: inherit;
  background: #0f172a;
}

.schift-editor-root * {
  box-sizing: border-box;
  letter-spacing: 0;
}

.schift-editor-root > div.flex.flex-col.h-screen {
  height: 100% !important;
  min-height: 0 !important;
}

.schift-editor-root header {
  height: 52px !important;
  padding-inline: 14px !important;
  background: #111827 !important;
  border-color: rgba(148, 163, 184, 0.22) !important;
}

.schift-editor-root header button {
  min-height: 32px;
}

.schift-editor-root header > span {
  white-space: nowrap;
}

.schift-editor-root > div > div.flex.flex-1.overflow-hidden {
  min-height: 0;
}

.schift-editor-root > div > div.flex.flex-1.overflow-hidden > aside:first-child {
  width: 224px !important;
  background: #0f172a !important;
}

.schift-editor-root > div > div.flex.flex-1.overflow-hidden > aside:last-child {
  width: 304px !important;
  background: #0f172a !important;
}

.schift-editor-root > div > div.flex.flex-1.overflow-hidden > aside:first-child > div:first-child {
  padding: 14px !important;
}

.schift-editor-root > div > div.flex.flex-1.overflow-hidden > aside:first-child > div:first-child > p:last-child {
  display: none !important;
}

.schift-editor-root > div > div.flex.flex-1.overflow-hidden > aside:first-child > div:nth-child(2) {
  display: none !important;
}

.schift-editor-root aside input {
  height: 34px;
  font-size: 13px !important;
}

.schift-editor-root div[draggable="true"] {
  margin-inline: 8px;
  border-radius: 8px !important;
  padding: 8px 10px !important;
}

.schift-editor-root div[draggable="true"] span:first-child {
  width: 24px !important;
  height: 24px !important;
}

.schift-editor-root div[draggable="true"] span {
  font-size: 12px !important;
}

.schift-editor-root div[draggable="true"] span.uppercase {
  display: none !important;
}

.schift-editor-root svg text {
  font-family: inherit !important;
  paint-order: stroke;
}

.schift-editor-root svg text[font-size="14"] {
  font-size: 12px !important;
}

.schift-editor-root svg text[font-size="11"] {
  font-size: 10.5px !important;
}

.schift-editor-root svg text[font-size="9"],
.schift-editor-root svg text[font-size="8"] {
  font-size: 8.5px !important;
}

.schift-editor-root .absolute.bottom-3.left-3 {
  opacity: 0.78;
  transform: scale(0.78);
  transform-origin: bottom left;
}

.schift-editor-root .absolute.bottom-3.right-3 {
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.schift-editor-root aside:last-child > div {
  width: 100%;
}

.schift-editor-root aside:last-child .rounded-lg {
  border-radius: 8px !important;
}

.schift-editor-root textarea,
.schift-editor-root input,
.schift-editor-root select {
  border-radius: 7px !important;
}
`;

function ensureAgayaWorkflowBlocksRegistered() {
  for (const block of AGAYA_WORKFLOW_BLOCKS) {
    const existing = BLOCK_TYPES.find((item) => item.type === block.type);
    if (existing) Object.assign(existing, block);
    else BLOCK_TYPES.push(block);
  }
}

ensureAgayaWorkflowBlocksRegistered();

function translateEditorText(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();

  while (node) {
    const text = node.textContent;
    if (text) {
      let next = text.replace(/&blacktriangleright;\s*/g, "");
      const trimmed = next.trim();
      const replacement = EDITOR_TEXT_REPLACEMENTS[trimmed];

      if (replacement) {
        next = next.replace(trimmed, replacement);
      }

      next = next.replace(
        /(\d+) blocks · (\d+) edges/g,
        "$1개 블록 · $2개 연결",
      );
      next = next.replace(/(\d+) selected/g, "$1개 선택됨");
      next = next.replace(
        /Run ([^ ]+) completed with status: ([^\n]+)/g,
        "실행 $1 완료: $2",
      );

      if (next !== text) {
        node.textContent = next;
      }
    }
    node = walker.nextNode();
  }

  root
    .querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement
    >("input[placeholder], textarea[placeholder]")
    .forEach((element) => {
      const value = element.getAttribute("placeholder");
      const replacement = value ? EDITOR_ATTRIBUTE_REPLACEMENTS[value] : null;
      if (replacement) element.setAttribute("placeholder", replacement);
    });

  root
    .querySelectorAll<HTMLElement>("[title], [aria-label]")
    .forEach((element) => {
      for (const attr of ["title", "aria-label"]) {
        const value = element.getAttribute(attr);
        const replacement = value ? EDITOR_ATTRIBUTE_REPLACEMENTS[value] : null;
        if (replacement) element.setAttribute(attr, replacement);
      }
    });
}

function createAdminWorkflowAPI(
  base = "/api/admin/schift/workflows",
): WorkflowEditorAPI {
  async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) {
      const body = await res.text();
      try {
        const parsed = JSON.parse(body) as { error?: string };
        if (typeof parsed.error === "string" && parsed.error.trim()) {
          throw new Error(parsed.error.trim());
        }
      } catch {
        // Fall back to the raw body when the response is not JSON.
      }
      throw new Error(body || `Request failed: ${res.status}`);
    }
    return (await res.json()) as T;
  }

  /** Ensure graph always has blocks[] and edges[] arrays */
  function normalizeWorkflow(wf: Workflow): Workflow {
    const graph = wf.graph as Workflow["graph"] & {
      nodes?: Workflow["graph"]["blocks"];
    };
    const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
    const rawBlocks = Array.isArray(graph.blocks) ? graph.blocks : [];
    const blocks = nodes.length > 0 ? nodes : rawBlocks;
    const edges = graph.edges ?? [];
    const normalizedGraph: Workflow["graph"] = { ...graph, blocks, edges };
    return { ...wf, graph: normalizedGraph };
  }

  return {
    list: () =>
      fetchJSON<Workflow[]>(base).then((items) => items.map(normalizeWorkflow)),
    get: async (id) => {
      try {
        return await fetchJSON<Workflow>(`${base}/${id}`).then(
          normalizeWorkflow,
        );
      } catch (error) {
        const is404 =
          error instanceof Error &&
          (error.message.includes("404") ||
            error.message.includes("not found") ||
            error.message.includes("Workflow not found"));
        if (!is404) throw error;

        // 워크플로우가 Schift에서 삭제됨 — 목록에서 대체 워크플로우를 찾거나 새로 생성
        const workflows = await fetchJSON<Workflow[]>(base).then((items) =>
          items.map(normalizeWorkflow),
        );
        if (workflows.length > 0) return workflows[0];

        throw error;
      }
    },
    create: (req) =>
      fetchJSON<Workflow>(base, {
        method: "POST",
        body: JSON.stringify(req),
      }).then(normalizeWorkflow),
    update: (id, req) =>
      fetchJSON<Workflow>(`${base}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(req),
      }).then(normalizeWorkflow),
    delete: async (id) => {
      await fetchJSON<unknown>(`${base}/${id}`, { method: "DELETE" });
    },
    run: (id, inputs) =>
      fetchJSON<WorkflowRun>(`${base}/${id}/run`, {
        method: "POST",
        body: JSON.stringify({ query: "", ...inputs }),
      }),
    validate: async () => ({ valid: true, errors: [] }),
  };
}

interface Props {
  workflowId?: string | null;
  apiBase?: string;
  onBack: () => void;
}

export function AdminWorkflowEditorAdapter({
  workflowId,
  apiBase,
  onBack,
}: Props) {
  const api = useMemo(() => createAdminWorkflowAPI(apiBase), [apiBase]);
  const handleBack = useCallback(() => onBack(), [onBack]);
  const editorRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = editorRootRef.current;
    if (!root) return;
    const rootNode = root;

    translateEditorText(rootNode);

    const observer = new MutationObserver(() => translateEditorText(rootNode));
    observer.observe(rootNode, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  return (
    <WorkflowEditorProvider api={api}>
      <div
        ref={editorRootRef}
        className="schift-editor-root h-full min-h-[500px] [--schift-black:#0a0a0f] [--schift-blue:#3b82f6] [--schift-gray-100:#111118] [--schift-gray-30:#b0b0c8] [--schift-gray-50:#71718a] [--schift-gray-60:#50506b] [--schift-gray-70:#35354a] [--schift-gray-80:#252530] [--schift-gray-90:#1a1a24] [--schift-green:#10b981] [--schift-red:#ef4444] [--schift-white:#e8e8f0] [--schift-yellow:#f59e0b]"
      >
        <style>{WORKFLOW_EDITOR_POLISH}</style>
        <WorkflowBuilder
          initialWorkflowId={workflowId ?? null}
          onBack={handleBack}
        />
      </div>
    </WorkflowEditorProvider>
  );
}
