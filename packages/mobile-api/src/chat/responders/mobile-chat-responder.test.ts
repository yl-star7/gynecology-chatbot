import { createMobileChatResponder } from "./mobile-chat-responder";

describe("mobile chat responder", () => {
  it("passes memory context into workflow inputs", async () => {
    const runWorkflow = jest.fn().mockResolvedValue({
      run: {
        status: "completed",
        outputs: { answer: "workflow 답변" },
      },
    });

    const responder = createMobileChatResponder({
      getSchiftClient: () => ({ workflows: { run: jest.fn() } }),
      runSchiftWorkflow: runWorkflow,
      extractSchiftWorkflowOutputs: (run) => run.outputs ?? {},
      formatSchiftWorkflowRun: () => "답변: workflow 답변",
      loadCharacterImages: async () => ({}),
    });

    await responder({
      promptContext: {
        pregnancyWeek: 13,
        dayNumber: 1,
        week: {
          id: "week-13",
          week_number: 13,
          title: "13주차",
          baby_summary: null,
          mother_summary: null,
          warning_signs: null,
          recommended_actions: null,
          checklist_intro: null,
          question_intro: null,
          status: "published",
        },
        dayContent: null,
        checklists: [],
        questions: [],
        tonePreference: "차분하게",
        profileMemory: {
          lastEmotionTone: "tired",
          personaHint: "practical",
          personaConfidence: "medium",
        },
        sessionMemory: {
          compactSummary: "최근 복통 상담",
          lastScenario: "symptom_counsel",
          lastCharacterTone: "anxious",
          workflowVersion: 2,
          stage: 2,
          stageName: "question_inference",
          moodId: "tired",
          moodLabel: "피곤해요",
        },
        onboardingPayload: null,
        missingFields: [],
      },
      currentWeek: 13,
      normalizedSessionId: "session-1",
      text: "배가 아파요",
      imageDataUris: [],
      hardGuardrailReason: null,
    });

    expect(runWorkflow).toHaveBeenCalledWith({
      schift: expect.any(Object),
      inputs: expect.objectContaining({
        compactSummary: "최근 복통 상담",
        lastScenario: "symptom_counsel",
        lastCharacterTone: "anxious",
        lastEmotionTone: "tired",
        personaHint: "practical",
        personaConfidence: "medium",
        tonePreference: "차분하게",
        workflowVersion: 2,
        workflowStage: 2,
        workflowStageName: "question_inference",
        sessionMoodId: "tired",
        sessionMoodLabel: "피곤해요",
      }),
    });
  });

  it("passes workflow V2 stage and tone context into workflow inputs", async () => {
    const runWorkflow = jest.fn().mockResolvedValue({
      run: {
        status: "completed",
        outputs: {
          answer: JSON.stringify({
            answer: "그 질문을 골라주셨군요.",
            scenario: "letter_reflection",
            nextSessionMemory: {
              compactSummary: "현재 단계: 편지 후속 질문",
              lastScenario: "letter_reflection",
            },
          }),
        },
      },
    });

    const responder = createMobileChatResponder({
      getSchiftClient: () => ({ workflows: { run: jest.fn() } }),
      runSchiftWorkflow: runWorkflow,
      extractSchiftWorkflowOutputs: (run) => run.outputs ?? {},
      formatSchiftWorkflowRun: () => "답변: ok",
      loadCharacterImages: async () => ({}),
    });

    await responder({
      promptContext: {
        pregnancyWeek: 28,
        dayNumber: 3,
        week: {
          id: "week-28",
          week_number: 28,
          title: "28주차",
          baby_summary: null,
          mother_summary: null,
          warning_signs: null,
          recommended_actions: null,
          checklist_intro: null,
          question_intro: null,
          status: "published",
        },
        dayContent: null,
        checklists: [],
        questions: [
          {
            id: "question-1",
            code: "attachment",
            question_text: "오늘 아기에게 가장 먼저 들려주고 싶은 말은 무엇인가요?",
            question_type: "text",
            help_text: null,
            question_payload: {},
            display_order: 1,
            is_required: true,
          },
        ],
        tonePreference: "차분하게",
        profileMemory: null,
        sessionMemory: {
          compactSummary: "현재 단계: 모아애착 질문",
          lastScenario: "attachment_question",
          lastEmotionTone: "anxious",
        },
        onboardingPayload: null,
        missingFields: [],
      },
      currentWeek: 28,
      normalizedSessionId: "session-1",
      text: "오늘 아기에게 가장 먼저 들려주고 싶은 말은 무엇인가요?",
      selectedQuestionId: "question-1",
      imageDataUris: [],
      hardGuardrailReason: null,
    });

    expect(runWorkflow).toHaveBeenCalledWith({
      schift: expect.any(Object),
      inputs: expect.objectContaining({
        currentStage: "attachment_question",
        currentTurnStage: "stage=2/question-choice",
        selectedQuestionId: "question-1",
        requiredToneContext: expect.stringContaining("anxious"),
        stageContext: expect.stringContaining(
          "이전 workflow를 replay하지 말고 inference로 직접 라우팅",
        ),
      }),
    });
  });

  it("skips RAG lookup after workflow v2 has already injected context", async () => {
    const runWorkflow = jest.fn().mockResolvedValue({
      run: {
        status: "completed",
        outputs: {
          answer: JSON.stringify({
            answer: "앞에서 고른 질문으로 바로 이어갈게요.",
            scenario: "letter_reflection",
          }),
        },
      },
    });
    const loadRagContext = jest.fn().mockResolvedValue({
      context: "검색 문맥",
      sources: [],
    });

    const responder = createMobileChatResponder({
      getSchiftClient: () => ({ workflows: { run: jest.fn() } }),
      runSchiftWorkflow: runWorkflow,
      extractSchiftWorkflowOutputs: (run) => run.outputs ?? {},
      formatSchiftWorkflowRun: () => "답변: ok",
      loadCharacterImages: async () => ({}),
      loadRagContext,
    });

    await responder({
      promptContext: {
        pregnancyWeek: 28,
        dayNumber: 3,
        week: {
          id: "week-28",
          week_number: 28,
          title: "28주차",
          baby_summary: null,
          mother_summary: null,
          warning_signs: null,
          recommended_actions: null,
          checklist_intro: null,
          question_intro: null,
          status: "published",
        },
        dayContent: null,
        checklists: [],
        questions: [],
        tonePreference: null,
        profileMemory: null,
        sessionMemory: {
          workflowVersion: 2,
          stage: 2,
          stageName: "question_inference",
          compactSummary: "이미 오늘 질문과 주차 정보를 문맥에 넣었어요.",
          lastScenario: "letter_reflection",
          ragContext: "28주차 사전 주입 RAG 문맥",
          ragContextWeek: 28,
        },
        onboardingPayload: null,
        missingFields: [],
      },
      currentWeek: 28,
      normalizedSessionId: "session-1",
      text: "조금 더 말하고 싶어요",
      imageDataUris: [],
      hardGuardrailReason: null,
    });

    expect(loadRagContext).not.toHaveBeenCalled();
    expect(runWorkflow).toHaveBeenCalledWith({
      schift: expect.any(Object),
      inputs: expect.objectContaining({
        results: "28주차 사전 주입 RAG 문맥",
        stageContext: expect.stringContaining("workflow_version=2"),
      }),
    });
  });

  it("loads RAG context only for fresh information turns", async () => {
    const runWorkflow = jest.fn().mockResolvedValue({
      run: {
        status: "completed",
        outputs: {
          answer: JSON.stringify({
            answer: "28주차 태아 발달 정보를 볼게요.",
            scenario: "baby_info",
          }),
        },
      },
    });
    const loadRagContext = jest.fn().mockResolvedValue({
      context: "28주차 태아 발달 검색 문맥",
      sources: [{ title: "28주차 문서" }],
    });

    const responder = createMobileChatResponder({
      getSchiftClient: () => ({ workflows: { run: jest.fn() } }),
      runSchiftWorkflow: runWorkflow,
      extractSchiftWorkflowOutputs: (run) => run.outputs ?? {},
      formatSchiftWorkflowRun: () => "답변: ok",
      loadCharacterImages: async () => ({}),
      loadRagContext,
    });

    const result = await responder({
      promptContext: null,
      currentWeek: 28,
      normalizedSessionId: "session-1",
      text: "28주차 태아 발달 알려줘",
      imageDataUris: [],
      hardGuardrailReason: null,
    });

    expect(loadRagContext).toHaveBeenCalledWith({
      query: "28주차 태아 발달 알려줘",
      currentWeek: 28,
    });
    expect(runWorkflow).toHaveBeenCalledWith({
      schift: expect.any(Object),
      inputs: expect.objectContaining({
        results: "28주차 태아 발달 검색 문맥",
      }),
    });
    expect(result.assistantMessage.parts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "_rag_sources",
          sources: [{ title: "28주차 문서" }],
        }),
      ]),
    );
    expect(result.workflowMemoryPayload?.nextSessionMemory).toEqual(
      expect.objectContaining({
        ragContext: "28주차 태아 발달 검색 문맥",
        ragContextWeek: 28,
      }),
    );
  });

  it("combines baby and mother weekly information in the fallback info turn", async () => {
    const responder = createMobileChatResponder({
      getSchiftClient: () => ({ workflows: { run: jest.fn() } }),
      runSchiftWorkflow: jest.fn().mockResolvedValue({
        run: {
          status: "completed",
          outputs: {
            answer: JSON.stringify({
              answer: "아기 발달 정보를 볼까요?",
              scenario: "baby_info_offer",
            }),
          },
        },
      }),
      extractSchiftWorkflowOutputs: (run) => run.outputs ?? {},
      formatSchiftWorkflowRun: () => "답변: ok",
      loadCharacterImages: async () => ({}),
    });

    const result = await responder({
      promptContext: {
        pregnancyWeek: 28,
        dayNumber: 3,
        week: {
          id: "week-28",
          week_number: 28,
          title: "28주차",
          baby_summary: "아기는 눈을 뜨고 감는 연습을 해요.",
          mother_summary: "엄마는 허리와 골반 부담이 커질 수 있어요.",
          warning_signs: null,
          recommended_actions: null,
          checklist_intro: null,
          question_intro: null,
          status: "published",
        },
        dayContent: {
          id: "day-28-3",
          day_number: 3,
          title: "28주 3일",
          baby_development_payload: { items: ["아기의 감각이 더 또렷해져요."] },
          baby_message: null,
          mother_changes_payload: { items: ["배가 당기는 느낌이 늘 수 있어요."] },
        },
        checklists: [],
        questions: [],
        tonePreference: null,
        profileMemory: null,
        sessionMemory: {
          compactSummary: "현재 단계: 태아 발달 확인 제안",
          lastScenario: "baby_info_offer",
        },
        onboardingPayload: null,
        missingFields: [],
      },
      currentWeek: 28,
      normalizedSessionId: "session-1",
      text: "네, 알려주세요",
      imageDataUris: [],
      hardGuardrailReason: null,
    });

    const textPart = result.assistantMessage.parts.find(
      (part) => part.type === "text",
    );
    expect(textPart?.type).toBe("text");
    if (textPart?.type !== "text") return;
    expect(textPart.text).toContain("아기");
    expect(textPart.text).toContain("엄마");
    expect(textPart.text).toContain("오늘의 질문");
    expect(textPart.text).not.toContain("엄마 몸 변화도 이어서");
  });


  it("mirrors session emotion memory into profile memory for webhook dispatch", async () => {
    const responder = createMobileChatResponder({
      getSchiftClient: () => ({ workflows: { run: jest.fn() } }),
      runSchiftWorkflow: jest.fn().mockResolvedValue({
        run: {
          status: "completed",
          outputs: {
            answer: JSON.stringify({
              answer: "그 마음을 기억해둘게요.",
              characterTone: "anxious",
              scenario: "emotion_reason",
              nextSessionMemory: {
                compactSummary: "현재 단계: 감정 이유 확인",
                lastScenario: "emotion_reason",
                lastCharacterTone: "anxious",
                lastEmotionTone: "anxious",
              },
            }),
          },
        },
      }),
      extractSchiftWorkflowOutputs: (run) => run.outputs ?? {},
      formatSchiftWorkflowRun: () => "답변: ok",
      loadCharacterImages: async () => ({}),
    });

    const result = await responder({
      promptContext: null,
      currentWeek: 13,
      normalizedSessionId: "session-1",
      text: "걱정돼요",
      imageDataUris: [],
      hardGuardrailReason: null,
    });

    expect(result.workflowMemoryPayload?.nextSessionMemory).toEqual(
      expect.objectContaining({ lastEmotionTone: "anxious" }),
    );
    expect(result.workflowMemoryPayload?.nextProfileMemory).toEqual(
      expect.objectContaining({ lastEmotionTone: "anxious" }),
    );
  });

  it("throws when workflow output is empty", async () => {
    const responder = createMobileChatResponder({
      getSchiftClient: () => ({ workflows: { run: jest.fn() } }),
      runSchiftWorkflow: jest.fn().mockResolvedValue({
        run: {
          status: "completed",
          outputs: {},
        },
      }),
      extractSchiftWorkflowOutputs: (run) => run.outputs ?? {},
      formatSchiftWorkflowRun: () => "답변: {}",
      loadCharacterImages: async () => ({}),
    });

    await expect(
      responder({
        promptContext: null,
        currentWeek: 13,
        normalizedSessionId: "session-1",
        text: "배가 아파요",
        imageDataUris: [],
        hardGuardrailReason: null,
      }),
    ).rejects.toThrow("Schift workflow returned empty output");
  });

  it("adds current week metadata to weekly knowledge deep links", async () => {
    const responder = createMobileChatResponder({
      getSchiftClient: () => ({ workflows: { run: jest.fn() } }),
      runSchiftWorkflow: jest.fn().mockResolvedValue({
        run: {
          status: "completed",
          outputs: {
            answer: JSON.stringify({
              answer: "27주차 아기 발달 정보를 짧게 안내할게요.",
              scenario: "baby_info",
              deepLinks: [
                {
                  title: "아기 발달 사전",
                  description: "더 자세히 볼 수 있어요.",
                  target: "knowledge",
                },
              ],
            }),
          },
        },
      }),
      extractSchiftWorkflowOutputs: (run) => run.outputs ?? {},
      formatSchiftWorkflowRun: () => "답변: ok",
      loadCharacterImages: async () => ({}),
    });

    const result = await responder({
      promptContext: null,
      currentWeek: 27,
      normalizedSessionId: "session-1",
      text: "아기 발달 정보 알려줘",
      imageDataUris: [],
      hardGuardrailReason: null,
    });

    expect(result.assistantMessage.parts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "deepLink",
          target: "knowledge",
          weekNumber: 27,
        }),
      ]),
    );
  });

  it("throws when workflow output is not structured chat JSON", async () => {
    const responder = createMobileChatResponder({
      getSchiftClient: () => ({ workflows: { run: jest.fn() } }),
      runSchiftWorkflow: jest.fn().mockResolvedValue({
        run: {
          status: "completed",
          outputs: { text: "SPECIAL INSTRUCTION" },
        },
      }),
      extractSchiftWorkflowOutputs: (run) => run.outputs ?? {},
      formatSchiftWorkflowRun: () => "답변: SPECIAL INSTRUCTION",
      loadCharacterImages: async () => ({}),
    });

    await expect(
      responder({
        promptContext: null,
        currentWeek: 13,
        normalizedSessionId: "session-1",
        text: "오늘은 마음이 불안해요",
        imageDataUris: [],
        hardGuardrailReason: null,
      }),
    ).rejects.toThrow("Schift workflow returned unstructured output");
  });

  it("removes early closing quick replies during letter reflection flow", async () => {
    const responder = createMobileChatResponder({
      getSchiftClient: () => ({ workflows: { run: jest.fn() } }),
      runSchiftWorkflow: jest.fn().mockResolvedValue({
        run: {
          status: "completed",
          outputs: {
            answer: JSON.stringify({
              answer: "아기에게 따뜻한 마음을 잘 전하셨어요.",
              scenario: "letter_reflection",
              quickReplies: [
                { label: "오늘은 여기까지", message: "오늘은 여기까지" },
                { label: "더 이야기하기", message: "더 이야기하기" },
              ],
              nextSessionMemory: {
                compactSummary: "현재 단계: 편지 후속 질문",
                lastScenario: "letter_reflection",
              },
            }),
          },
        },
      }),
      extractSchiftWorkflowOutputs: (run) => run.outputs ?? {},
      formatSchiftWorkflowRun: () => "답변: ok",
      loadCharacterImages: async () => ({}),
    });

    const result = await responder({
      promptContext: null,
      currentWeek: 28,
      normalizedSessionId: "session-1",
      text: "아기에게 편지를 썼어요",
      imageDataUris: [],
      hardGuardrailReason: null,
    });

    const quickReplies = result.assistantMessage.parts.find(
      (part) => part.type === "quickReplies",
    );
    expect(quickReplies).toBeUndefined();
    const textPart = result.assistantMessage.parts.find(
      (part) => part.type === "text",
    );
    expect(textPart?.type).toBe("text");
    if (textPart?.type === "text") {
      expect(textPart.text).toContain("가장 크게 남은 마음은 무엇이었나요?");
    }
  });

  it("throws when workflow execution fails", async () => {
    const responder = createMobileChatResponder({
      getSchiftClient: () => ({ workflows: { run: jest.fn() } }),
      runSchiftWorkflow: jest
        .fn()
        .mockRejectedValue(new Error("No output specified.")),
      extractSchiftWorkflowOutputs: (run) => run.outputs ?? {},
      formatSchiftWorkflowRun: () => "답변: workflow 출력이 없어요.",
      loadCharacterImages: async () => ({}),
    });

    await expect(
      responder({
        promptContext: null,
        currentWeek: 40,
        normalizedSessionId: "session-1",
        text: "오늘은 마음이 불안해요",
        imageDataUris: [],
        hardGuardrailReason: null,
      }),
    ).rejects.toThrow("No output specified.");
  });
});
