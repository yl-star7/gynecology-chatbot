import { loadMaternalNursingWorkflow } from "./load-workflow-yaml";

function parsePromptJson(prompt: string | undefined) {
  expect(prompt).toBeDefined();
  return JSON.parse(prompt ?? "{}") as {
    scenario?: string;
    answerVariations?: string[];
    moodPrompts?: Array<{ label: string; message: string; tone: string }>;
  };
}

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

  it("loads workflow version 2 with the approved stage contract", () => {
    const workflow = loadMaternalNursingWorkflow();
    const rag = workflow.graph.blocks.find((block) => block.id === "rag");

    expect(workflow.version).toBe(2);
    expect(rag?.type).toBe("rag");
    expect(rag?.config?.system_prompt).toEqual(
      expect.stringContaining("Workflow v2 승인 플로우 계약"),
    );
    expect(rag?.config?.system_prompt).toEqual(
      expect.stringContaining("stage=0: mood_intake"),
    );
    expect(rag?.config?.system_prompt).toEqual(
      expect.stringContaining(
        "선택된 mood는 session memory와 tone context에 반드시 저장",
      ),
    );
    expect(rag?.config?.system_prompt).toEqual(
      expect.stringContaining("비동기 webhook/session memory 저장 경로"),
    );
    expect(rag?.config?.template).toEqual(
      expect.stringContaining("{{workflowStage}}"),
    );
    expect(rag?.config?.template).toEqual(
      expect.stringContaining("{{selectedQuestionId}}"),
    );
  });

  it("keeps premade mood intake and weekly opt-in variation pools large enough", () => {
    const workflow = loadMaternalNursingWorkflow();
    const moodIntake = parsePromptJson(workflow.prompts.static_mood_intake);
    const weekInfoOptIn = parsePromptJson(
      workflow.prompts.static_week_info_opt_in,
    );

    expect(moodIntake.scenario).toBe("mood_intake");
    expect(moodIntake.moodPrompts).toHaveLength(20);
    expect(
      new Set(moodIntake.moodPrompts?.map((prompt) => prompt.label)),
    ).toHaveProperty("size", 20);
    expect(moodIntake.moodPrompts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "좋아요", tone: "joyful" }),
        expect.objectContaining({ label: "걱정돼요", tone: "anxious" }),
        expect.objectContaining({ label: "피곤해요", tone: "tired" }),
        expect.objectContaining({ label: "슬퍼요", tone: "sad" }),
      ]),
    );

    expect(weekInfoOptIn.scenario).toBe("week_info_opt_in");
    expect(weekInfoOptIn.answerVariations).toHaveLength(20);
    expect(new Set(weekInfoOptIn.answerVariations)).toHaveProperty("size", 20);
    expect(weekInfoOptIn.answerVariations?.[0]).toEqual(
      expect.stringContaining("오늘 주차"),
    );
    expect(weekInfoOptIn.answerVariations?.join("\n")).toEqual(
      expect.stringContaining("산모"),
    );
    expect(weekInfoOptIn.answerVariations?.join("\n")).toEqual(
      expect.stringContaining("태아"),
    );
  });

  it("keeps the executable Schift graph simple and stable", () => {
    const workflow = loadMaternalNursingWorkflow();

    expect(workflow.graph.blocks.map((block) => block.id)).toEqual([
      "start",
      "rag",
      "summary_webhook",
      "end",
    ]);
    const webhookBlock = workflow.graph.blocks.find(
      (block) => block.id === "summary_webhook",
    );
    expect(webhookBlock?.type).toBe("outbound_webhook");
    const ragBlock = workflow.graph.blocks.find((block) => block.id === "rag");
    expect(ragBlock?.type).toBe("rag");
    expect(ragBlock?.config).toEqual(
      expect.objectContaining({
        collection: "pregnancy-knowledge",
        top_k: 5,
        model: "gemini-2.5-flash-lite",
        thinking_budget: 0,
      }),
    );
    expect(workflow.graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "start",
          target: "rag",
          source_handle: "out",
          target_handle: "in",
        }),
        expect.objectContaining({
          source: "rag",
          target: "end",
          source_handle: "out",
          target_handle: "in",
        }),
      ]),
    );
  });

  it("stores stage contracts inside the main prompt", () => {
    const workflow = loadMaternalNursingWorkflow();
    const tmpl = workflow.graph.blocks.find((block) => block.id === "rag");

    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining("Y path"),
    );
    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining("N path"),
    );
    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining("knowledge deep link/sheet"),
    );
    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining("오늘의 질문을 동시에 준비"),
    );
    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining("stage=2"),
    );
    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining(
        "이전 workflow를 replay하지 말고 inference로 직접 라우팅",
      ),
    );
  });

  it("guides combined weekly info and keeps weekly questions separate", () => {
    const workflow = loadMaternalNursingWorkflow();
    const tmpl = workflow.graph.blocks.find((block) => block.id === "rag");

    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining(
        "아기 정보와 엄마 정보를 한 answer에 함께 담으세요",
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

  it("defines the post-question continuation and ending contract", () => {
    const workflow = loadMaternalNursingWorkflow();
    const tmpl = workflow.graph.blocks.find((block) => block.id === "rag");

    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining("두 번째 질문"),
    );
    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining("자유 대화"),
    );
    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining("compressed log"),
    );
    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining("제한 없이"),
    );
    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining("end는 summary를 트리거"),
    );
  });
});
