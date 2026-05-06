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
        recentMessages: [
          {
            role: "assistant",
            text: "몸 상태에서 어떤 점이 가장 불편한가요?",
            createdAt: "2026-05-03T14:56:40.000Z",
          },
          {
            role: "user",
            text: "가만히 있기?",
            createdAt: "2026-05-03T14:56:59.000Z",
          },
        ],
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
        compressedLog:
          "Assistant: 몸 상태에서 어떤 점이 가장 불편한가요?\nUser: 가만히 있기?",
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
            question_text:
              "오늘 아기에게 가장 먼저 들려주고 싶은 말은 무엇인가요?",
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
          ragContext: "28주차 임신백과 주입 RAG 문맥",
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
        results: "28주차 임신백과 주입 RAG 문맥",
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

  it("continues workflow when fresh RAG lookup times out", async () => {
    const runWorkflow = jest.fn().mockResolvedValue({
      run: {
        status: "completed",
        outputs: {
          answer: JSON.stringify({
            answer: "주차 정보는 지금 대화 흐름 안에서 짧게 이어갈게요.",
            scenario: "baby_info",
          }),
        },
      },
    });
    const loadRagContext = jest
      .fn()
      .mockRejectedValue(new Error("File RAG weekly search timed out"));

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
      currentWeek: 33,
      normalizedSessionId: "session-1",
      text: "33주차 정보 볼래요",
      imageDataUris: [],
      hardGuardrailReason: null,
    });

    expect(loadRagContext).toHaveBeenCalledWith({
      query: "33주차 정보 볼래요",
      currentWeek: 33,
    });
    expect(runWorkflow).toHaveBeenCalledWith({
      schift: expect.any(Object),
      inputs: expect.objectContaining({
        results: null,
      }),
    });
    expect(result.assistantMessage.parts).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "_rag_sources" }),
      ]),
    );
  });

  it("combines baby and mother weekly information in the static info turn", async () => {
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
          mother_changes_payload: {
            items: ["배가 당기는 느낌이 늘 수 있어요."],
          },
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

  it("reports workflow errors instead of synthesizing a stage=0 response", async () => {
    const responder = createMobileChatResponder({
      getSchiftClient: () => ({ workflows: { run: jest.fn() } }),
      runSchiftWorkflow: jest
        .fn()
        .mockRejectedValue(new Error("should not run")),
      extractSchiftWorkflowOutputs: (run) => run.outputs ?? {},
      formatSchiftWorkflowRun: () => "답변: workflow 출력이 없어요.",
      loadCharacterImages: async () => ({}),
    });

    await expect(
      responder({
        promptContext: {
          pregnancyWeek: 27,
          dayNumber: 1,
          week: {
            id: "week-27",
            week_number: 27,
            title: "27주차",
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
            stage: 0,
            stageName: "mood_intake",
            compactSummary: "현재 단계: 감정 확인",
            lastScenario: "emotion_checkin",
          },
          onboardingPayload: null,
          missingFields: [],
        },
        currentWeek: 27,
        normalizedSessionId: "session-1",
        text: "오늘은 몸이 많이 피곤해요",
        imageDataUris: [],
        hardGuardrailReason: null,
      }),
    ).rejects.toThrow("should not run");
  });

  it("routes active question answers to letter workflow", async () => {
    const runWorkflow = jest.fn().mockResolvedValue({
      run: {
        status: "completed",
        outputs: {
          answer: JSON.stringify({
            answer: "아기에게 전한 마음을 잘 받았어요.",
            scenario: "letter_reflection",
            nextSessionMemory: {
              stage: 2,
              stageName: "choice_conversation",
              compactSummary: "현재 단계: 편지 후속 질문",
              lastScenario: "letter_reflection",
              currentAttachmentQuestionId: "question-1",
            },
          }),
        },
      },
    });
    const selectWorkflowId = jest.fn().mockReturnValue("letter-workflow");
    const responder = createMobileChatResponder({
      getSchiftClient: () => ({ workflows: { run: jest.fn() } }),
      runSchiftWorkflow: runWorkflow,
      extractSchiftWorkflowOutputs: (run) => run.outputs ?? {},
      formatSchiftWorkflowRun: () => "답변: ok",
      loadCharacterImages: async () => ({}),
      selectWorkflowId,
    });

    const result = await responder({
      promptContext: {
        pregnancyWeek: 24,
        dayNumber: 1,
        week: {
          id: "week-24",
          week_number: 24,
          title: "24주차",
          baby_summary: "아기는 빠르게 자라고 있어요.",
          mother_summary: "엄마 몸도 변화를 느낄 수 있어요.",
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
            question_text: "오늘 아기에게 어떤 말을 해주고 싶나요?",
            question_type: "text",
            help_text: null,
            question_payload: {},
            display_order: 1,
            is_required: true,
          },
        ],
        tonePreference: null,
        profileMemory: null,
        sessionMemory: {
          workflowVersion: 2,
          stage: 2,
          stageName: "choice_conversation",
          compactSummary: "현재 단계: 질문 답변 대기 (question-1)",
          lastScenario: "attachment_question",
          currentAttachmentQuestionId: "question-1",
          answeredQuestionIds: [],
        } as never,
        onboardingPayload: null,
        missingFields: [],
      },
      currentWeek: 24,
      normalizedSessionId: "session-1",
      text: "아기에게 고맙고 사랑한다고 말해주고 싶어요.",
      imageDataUris: [],
      hardGuardrailReason: null,
    });

    expect(selectWorkflowId).toHaveBeenCalledWith(
      expect.objectContaining({
        workflowStage: 2,
        currentAttachmentQuestionId: "question-1",
      }),
    );
    expect(runWorkflow).toHaveBeenCalledWith({
      schift: expect.any(Object),
      workflowId: "letter-workflow",
      inputs: expect.objectContaining({
        workflowStage: 2,
        currentAttachmentQuestionId: "question-1",
      }),
    });
    expect(result.workflowMemoryPayload?.scenario).toBe("letter_reflection");
    const textPart = result.assistantMessage.parts.find(
      (part) => part.type === "text",
    );
    expect(textPart?.type).toBe("text");
    if (textPart?.type === "text") {
      expect(textPart.text).not.toContain("주차 정보를 같이 볼게요");
    }
  });

  it("reports workflow errors instead of synthesizing a letter response", async () => {
    const responder = createMobileChatResponder({
      getSchiftClient: () => ({ workflows: { run: jest.fn() } }),
      runSchiftWorkflow: jest
        .fn()
        .mockRejectedValue(new Error("workflow unavailable")),
      extractSchiftWorkflowOutputs: (run) => run.outputs ?? {},
      formatSchiftWorkflowRun: () => "답변: workflow 출력이 없어요.",
      loadCharacterImages: async () => ({}),
    });

    await expect(
      responder({
        promptContext: {
          pregnancyWeek: 24,
          dayNumber: 1,
          week: {
            id: "week-24",
            week_number: 24,
            title: "24주차",
            baby_summary: "아기는 빠르게 자라고 있어요.",
            mother_summary: "엄마 몸도 변화를 느낄 수 있어요.",
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
            stageName: "choice_conversation",
            compactSummary: "현재 단계: 질문 답변 대기 (question-1)",
            lastScenario: "attachment_question",
            currentAttachmentQuestionId: "question-1",
            answeredQuestionIds: [],
          } as never,
          onboardingPayload: null,
          missingFields: [],
        },
        currentWeek: 24,
        normalizedSessionId: "session-1",
        text: "아기에게 고맙고 사랑한다고 말해주고 싶어요.",
        imageDataUris: [],
        hardGuardrailReason: null,
      }),
    ).rejects.toThrow("workflow unavailable");
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
      expect(textPart.text).toBe("아기에게 따뜻한 마음을 잘 전하셨어요.");
    }
  });

  it("keeps attachment question quick reply ids tied to the visible question", async () => {
    const questionId = "550e8400-e29b-41d4-a716-446655440025";
    const questionText =
      "오늘은 감사에 대해 엄마의 생각을 들려주세요. 살아오면서 엄마에게 가장 감사했던 사람은 누구였나요?";
    const responder = createMobileChatResponder({
      getSchiftClient: () => ({ workflows: { run: jest.fn() } }),
      runSchiftWorkflow: jest.fn().mockResolvedValue({
        run: {
          status: "completed",
          outputs: {
            answer: JSON.stringify({
              answer: "아래 질문 중 하나를 골라 이어가요.",
              scenario: "attachment_question",
              quickReplies: [
                {
                  label: questionText,
                  message: questionText,
                },
              ],
              selectedQuestionIds: [questionId],
              nextSessionMemory: {
                compactSummary: "현재 단계: 모아애착 질문",
                lastScenario: "attachment_question",
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
      promptContext: {
        pregnancyWeek: 24,
        dayNumber: 1,
        week: {
          id: "week-24",
          week_number: 24,
          title: "24주차",
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
            id: questionId,
            code: "attachment",
            question_text: questionText,
            question_type: "text",
            help_text: null,
            question_payload: {},
            display_order: 1,
            is_required: true,
          },
        ],
        tonePreference: null,
        profileMemory: null,
        sessionMemory: {
          workflowVersion: 2,
          stage: 1,
          stageName: "today_question",
          compactSummary: "현재 단계: 모아애착 질문",
          lastScenario: "attachment_question",
        },
        onboardingPayload: null,
        missingFields: [],
      },
      currentWeek: 24,
      normalizedSessionId: "session-1",
      text: "질문 보기",
      imageDataUris: [],
      hardGuardrailReason: null,
    });

    const quickReplies = result.assistantMessage.parts.find(
      (part) => part.type === "quickReplies",
    );
    expect(quickReplies?.type).toBe("quickReplies");
    if (quickReplies?.type === "quickReplies") {
      expect(quickReplies.choices).toEqual([
        expect.objectContaining({
          id: questionId,
          label: questionText,
          message: questionText,
        }),
      ]);
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
