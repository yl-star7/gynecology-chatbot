import { loadMaternalNursingWorkflow } from "./load-workflow-yaml";

describe("maternal nursing workflow YAML", () => {
  const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRole;
  });

  it("loads the Mermaid-guided state machine into the prompt template", () => {
    const workflow = loadMaternalNursingWorkflow();
    const tmpl = workflow.graph.blocks.find((block) => block.id === "tmpl");

    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining("Mermaid 단계 상태 머신"),
    );
    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining("currentStage='letter_reflection'"),
    );
    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining("nextSessionMemory.compactSummary"),
    );
    expect(tmpl?.config?.template).toEqual(
      expect.stringContaining("## 대화 상태 입력"),
    );
    expect(tmpl?.config?.template).toEqual(
      expect.stringContaining("{{compactSummary}}"),
    );
    expect(tmpl?.config?.template).toEqual(
      expect.stringContaining("{{lastScenario}}"),
    );
  });

  it("keeps the executable Schift graph simple and stable", () => {
    const workflow = loadMaternalNursingWorkflow();

    expect(workflow.graph.blocks.map((block) => block.id)).toEqual([
      "start",
      "guardrail_router",
      "retriever",
      "tmpl",
      "llm",
      "answer",
      "end",
    ]);
    expect(workflow.graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "guardrail_router",
          target: "retriever",
          source_handle: "safe",
          target_handle: "_gate",
        }),
        expect.objectContaining({
          source: "start",
          target: "retriever",
          target_handle: "query",
        }),
        expect.objectContaining({
          source: "retriever",
          target: "tmpl",
          source_handle: "results",
        }),
        expect.objectContaining({
          source: "tmpl",
          target: "llm",
          source_handle: "prompt",
          target_handle: "prompt",
        }),
        expect.objectContaining({
          source: "tmpl",
          target: "llm",
          source_handle: "system_prompt",
          target_handle: "system_prompt",
        }),
        expect.objectContaining({
          source: "llm",
          target: "answer",
          source_handle: "text",
          target_handle: "text",
        }),
        expect.objectContaining({
          source: "answer",
          target: "end",
          source_handle: "answer",
        }),
      ]),
    );
  });

  it("stores stage contracts inside the main prompt", () => {
    const workflow = loadMaternalNursingWorkflow();
    const tmpl = workflow.graph.blocks.find((block) => block.id === "tmpl");

    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining("currentStage='baby_info'"),
    );
    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining("다 했어요 / 하나만 했어요 / 이따가 할래요"),
    );
    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining("현재 단계: 편지 후속 질문"),
    );
    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining("태동/데일리 후속 질문"),
    );
    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining("deepLink를 만들지 말고"),
    );
  });
});
