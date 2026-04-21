import { loadMaternalNursingWorkflow } from "./load-workflow-yaml";

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

describe("maternal nursing workflow YAML", () => {
  const originalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalGcsWorkflowBucket = process.env.GCS_WORKFLOW_BUCKET;
  const originalGcsProjectId = process.env.GCS_PROJECT_ID;
  const originalGoogleCloudProject = process.env.GOOGLE_CLOUD_PROJECT;
  const originalGoogleApplicationCredentials =
    process.env.GOOGLE_APPLICATION_CREDENTIALS;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.GCS_WORKFLOW_BUCKET;
    delete process.env.GCS_PROJECT_ID;
    delete process.env.GOOGLE_CLOUD_PROJECT;
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
  });

  afterAll(() => {
    restoreEnv("NEXT_PUBLIC_SUPABASE_URL", originalSupabaseUrl);
    restoreEnv("SUPABASE_SERVICE_ROLE_KEY", originalServiceRole);
    restoreEnv("GCS_WORKFLOW_BUCKET", originalGcsWorkflowBucket);
    restoreEnv("GCS_PROJECT_ID", originalGcsProjectId);
    restoreEnv("GOOGLE_CLOUD_PROJECT", originalGoogleCloudProject);
    restoreEnv(
      "GOOGLE_APPLICATION_CREDENTIALS",
      originalGoogleApplicationCredentials,
    );
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
      "state_router",
      "guardrail_router",
      "retriever",
      "baby_info_offer_tmpl",
      "attachment_question_tmpl",
      "static_answer",
      "tmpl",
      "llm",
      "answer",
      "end",
    ]);
    expect(workflow.graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "state_router",
          target: "guardrail_router",
          source_handle: "normal",
          target_handle: "in",
        }),
        expect.objectContaining({
          source: "guardrail_router",
          target: "retriever",
          source_handle: "safe",
          target_handle: "_gate",
        }),
        expect.objectContaining({
          source: "state_router",
          target: "baby_info_offer_tmpl",
          source_handle: "baby_info_offer_static",
          target_handle: "vars",
        }),
        expect.objectContaining({
          source: "state_router",
          target: "attachment_question_tmpl",
          source_handle: "attachment_question_static",
          target_handle: "vars",
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
          source: "baby_info_offer_tmpl",
          target: "static_answer",
          source_handle: "prompt",
          target_handle: "text",
        }),
        expect.objectContaining({
          source: "attachment_question_tmpl",
          target: "static_answer",
          source_handle: "prompt",
          target_handle: "text",
        }),
        expect.objectContaining({
          source: "static_answer",
          target: "end",
          source_handle: "out",
          target_handle: "in",
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

  it("guides one-entity weekly info and keeps weekly questions separate", () => {
    const workflow = loadMaternalNursingWorkflow();
    const tmpl = workflow.graph.blocks.find((block) => block.id === "tmpl");

    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining(
        "아기 정보와 엄마 정보를 한 answer에 섞지 마세요",
      ),
    );
    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining("25주차 정보 요청"),
    );
    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining("검색된 내부 데이터나 사전 참고 자료"),
    );
    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining("주간 질문은 answer 안에 합쳐 쓰지 마세요"),
    );
  });

  it("routes deterministic stage transitions outside retrieval and generation", () => {
    const workflow = loadMaternalNursingWorkflow();
    const router = workflow.graph.blocks.find(
      (block) => block.id === "state_router",
    );
    const staticAnswer = workflow.graph.blocks.find(
      (block) => block.id === "static_answer",
    );

    expect(router?.config?.routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "baby_info_offer_static" }),
        expect.objectContaining({ name: "attachment_question_static" }),
      ]),
    );
    expect(staticAnswer?.config?.format).toBe("text");
    expect(workflow.prompts.static_baby_info_offer).toEqual(
      expect.stringContaining('"scenario":"baby_info_offer"'),
    );
    expect(workflow.prompts.static_attachment_question).toEqual(
      expect.stringContaining('"scenario":"attachment_question"'),
    );
  });
});
