import fs from "node:fs";
import path from "node:path";
import {
  loadMaternalNursingWorkflow,
  resolveWorkflowYamlLocationFromRows,
} from "./load-workflow-yaml";

function parsePromptJson(prompt: string | undefined) {
  expect(prompt).toBeDefined();
  return JSON.parse(prompt ?? "{}") as {
    answer?: string;
    scenario?: string;
    promptText?: string;
    directInputAcknowledgementText?: string;
    quickReplies?: unknown[];
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
  const originalGcsWorkflowBucket = process.env.GCS_WORKFLOW_BUCKET;
  const originalGcsProjectId = process.env.GCS_PROJECT_ID;
  const originalGoogleCloudProject = process.env.GOOGLE_CLOUD_PROJECT;
  const originalGoogleApplicationCredentials =
    process.env.GOOGLE_APPLICATION_CREDENTIALS;

  beforeEach(() => {
    delete process.env.GCS_WORKFLOW_BUCKET;
    delete process.env.GCS_PROJECT_ID;
    delete process.env.GOOGLE_CLOUD_PROJECT;
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
  });

  afterAll(() => {
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
    expect(workflow.source).toBe("local");
    expect(workflow.storagePath).toBe("maternal-nursing.yaml");
    expect(workflow.locationSource).toBeNull();
    expect(workflow.locationRowId).toBeNull();
    expect(workflow.locationSlug).toBeNull();
    expect(workflow.localPath).toEqual(
      expect.stringContaining("maternal-nursing.yaml"),
    );
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

  it("resolves the runtime YAML location from workflow_definitions row columns", () => {
    const location = resolveWorkflowYamlLocationFromRows([
      {
        id: "router-row",
        slug: "maternal-nursing-router",
        config: {
          workflowKind: "router",
          storagePath: "gs://agaya-workflow-config/maternal-nursing-router.yaml",
        },
        metadata: {},
        updated_at: "2026-05-06T10:00:00.000Z",
      },
      {
        id: "monolith-row",
        slug: "maternal-nursing-monolith",
        config: {
          workflowKind: "monolith",
          storagePath: "gs://agaya-workflow-config/workflows/runtime-v3.yaml",
        },
        metadata: {
          gcsBucket: "ignored-when-storage-path-is-gs-url",
          gcsObject: "ignored.yaml",
        },
        updated_at: "2026-05-06T11:00:00.000Z",
      },
    ]);

    expect(location).toEqual({
      bucket: "agaya-workflow-config",
      path: "workflows/runtime-v3.yaml",
      storagePath: "gs://agaya-workflow-config/workflows/runtime-v3.yaml",
      locationSource: "db",
      rowId: "monolith-row",
      slug: "maternal-nursing-monolith",
      updatedAt: "2026-05-06T11:00:00.000Z",
    });
  });

  it("does not infer the runtime YAML location from kind or object name without the runtime slug", () => {
    const location = resolveWorkflowYamlLocationFromRows([
      {
        id: "old-row",
        slug: "maternal-nursing",
        config: {
          workflowKind: "monolith",
          storagePath: "gs://agaya-workflow-config/maternal-nursing.yaml",
        },
        metadata: {},
        updated_at: "2026-05-06T11:00:00.000Z",
      },
    ]);

    expect(location).toBeNull();
  });

  it("keeps the retained router YAML detached from env workflow ids", () => {
    const routerYaml = fs.readFileSync(
      path.join(__dirname, "maternal-nursing-router.yaml"),
      "utf8",
    );

    expect(routerYaml).not.toContain("$env.");
    expect(routerYaml).not.toContain("SCHIFT_WF_");
  });

  it("keeps premade mood intake and weekly opt-in variation pools large enough", () => {
    const workflow = loadMaternalNursingWorkflow();
    const moodIntake = parsePromptJson(workflow.prompts.static_mood_intake);
    const weekInfoOptIn = parsePromptJson(
      workflow.prompts.static_week_info_opt_in,
    );

    expect(moodIntake.scenario).toBe("mood_intake");
    expect(moodIntake.promptText).toBe(
      "오늘은 마음이 어떠세요?\n\n편하게 하나만 골라도 좋고, 직접 말해줘도 괜찮아요.",
    );
    expect(moodIntake.directInputAcknowledgementText).toBe(
      "오늘의 기분 나눠줘서 고마워요. 잘 기억해서 차근차근 더 이야기 해볼게요.",
    );
    expect(moodIntake.moodPrompts).toHaveLength(20);
    expect(
      new Set(moodIntake.moodPrompts?.map((prompt) => prompt.label)),
    ).toHaveProperty("size", 20);
    expect(moodIntake.moodPrompts?.slice(0, 5)).toEqual([
      { label: "좋아요", message: "오늘은 좋은 기분이에요.", tone: "joyful" },
      { label: "우울해요", message: "오늘은 우울한 기분이에요.", tone: "sad" },
      { label: "슬퍼요", message: "오늘은 슬픈 기분이에요.", tone: "sad" },
      {
        label: "화나요",
        message: "오늘은 화나는 기분이에요.",
        tone: "anxious",
      },
      { label: "직접 입력", message: "직접 말하고 싶어요.", tone: "calm" },
    ]);
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

  it("keeps mood follow-up as text only without an extra quick reply bubble", () => {
    const workflow = loadMaternalNursingWorkflow();
    const babyInfoOffer = parsePromptJson(
      workflow.prompts.static_baby_info_offer,
    );

    expect(babyInfoOffer.scenario).toBe("baby_info_offer");
    expect(babyInfoOffer.quickReplies).toBeUndefined();
  });

  it("keeps question emphasis format aligned with the mobile renderer", () => {
    const workflow = loadMaternalNursingWorkflow();
    const rag = workflow.graph.blocks.find((block) => block.id === "rag");
    const babyInfoOffer = parsePromptJson(
      workflow.prompts.static_baby_info_offer,
    );
    const workflowFiles = [
      "maternal-nursing.yaml",
      "subworkflows/baby-info.yaml",
      "subworkflows/free-chat.yaml",
      "subworkflows/general.yaml",
      "subworkflows/letter-reflection.yaml",
    ].map((file) => fs.readFileSync(path.join(__dirname, file), "utf8"));

    expect(rag?.config?.system_prompt).toEqual(
      expect.stringContaining('**"질문 본문"**'),
    );
    expect(babyInfoOffer.answer).toEqual(
      expect.stringContaining('**"{{currentWeek}}주차'),
    );
    for (const source of workflowFiles) {
      expect(source).toEqual(expect.stringContaining('**"질문 본문"**'));
      expect(source).not.toEqual(
        expect.stringContaining('"**질문 본문**" (큰따옴표'),
      );
    }
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
      expect.stringContaining("검색된 내부 데이터나 임신백과 참고 자료"),
    );
    expect(tmpl?.config?.system_prompt).not.toContain(
      "오늘 해본 만큼으로도 충분해요",
    );
    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining("주간 질문은 answer 안에 합쳐 쓰지 마세요"),
    );
  });

  it("defines the post-question continuation and ending contract", () => {
    const workflow = loadMaternalNursingWorkflow();
    const tmpl = workflow.graph.blocks.find((block) => block.id === "rag");

    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining("다음 질문 목록"),
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
    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining("chat_flow.stages.question_answer.reflection_loop"),
    );
    expect(tmpl?.config?.system_prompt).toEqual(
      expect.stringContaining("reflection_loop.next_question_label_template"),
    );
  });
});
