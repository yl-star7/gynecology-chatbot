import type {
  AdminAllowedPhoneNumber,
  AdminDashboardData,
  AdminKnowledgeItem,
  AdminKnowledgeItemInput,
  AdminRagDocument,
  AdminRagDocumentDetail,
  AdminRagDocumentInput,
  AdminUserAction,
  AdminWorkflowRule,
  AdminWorkflowRuleInput,
  AdminWeekAsset,
  AdminWeekAssetInput,
  AdminWeekDay,
  AdminWeekDayInput,
  AdminWeekDetail,
  AdminWeekMedia,
  AdminWeekMediaInput,
  AdminWeekSection,
  AdminWeekSectionInput,
  AdminWeekSummary,
  AdminWeekUpdateInput,
  AuthenticatedUser,
  CalendarDay,
  ChatComposerInput,
  ChatSession,
  ChatMessage,
  EmotionTone,
  HomeViewData,
  MobileContentListItem,
  LinkTargetContent,
  OnboardingProfileInput,
  RecentChatSummary,
} from "./domain";
import type {
  AdminContentPort,
  AdminDashboardPort,
  AdminUserPort,
  AuthPort,
  KnowledgePort,
  MobileChatPort,
  MobileHomePort,
  OnboardingPort,
} from "./ports";

const emotionPalette: EmotionTone[] = [
  "joyful",
  "calm",
  "anxious",
  "tired",
  "sad",
  "calm",
  "joyful",
];

const mockAuthState: {
  user: AuthenticatedUser;
  onboardingInput: OnboardingProfileInput;
} = {
  user: {
    id: "mock-user-1",
    phoneNumber: "010-2345-6789",
    displayName: "김수연",
    hasCompletedOnboarding: false,
  },
  onboardingInput: {
    pregnancyWeekOrDueDate: "18주 6일",
    tonePreference: "차분하고 직접적인 설명",
  },
};

function buildCalendar(): CalendarDay[] {
  return Array.from({ length: 28 }, (_, index) => {
    const day = index + 1;
    const hasChat = day % 2 === 0 || day === 5 || day === 19;
    return {
      isoDate: `2026-03-${String(day).padStart(2, "0")}`,
      dayLabel: String(day),
      hasChat,
      emotionTone: hasChat
        ? emotionPalette[index % emotionPalette.length]
        : null,
      summary: hasChat ? "채팅 기록 있음" : undefined,
    };
  });
}

const recentChats: RecentChatSummary[] = [
  {
    id: "chat-today",
    title: "오늘 컨디션 채팅",
    preview: "두통이 있을 때 바로 내원해야 하나요?",
    updatedAtLabel: "방금 전",
    updatedAtIso: "2026-03-17T14:31:00.000Z",
  },
  {
    id: "chat-vitamins",
    title: "영양제 복용",
    preview: "철분제와 엽산 복용 시간을 정리했어요.",
    updatedAtLabel: "어제",
    updatedAtIso: "2026-03-16T09:10:00.000Z",
  },
  {
    id: "chat-work",
    title: "업무 피로",
    preview: "오래 앉아 있을 때 통증 관리법",
    updatedAtLabel: "3일 전",
    updatedAtIso: "2026-03-14T07:45:00.000Z",
  },
];

const baseMessages: Record<string, ChatMessage[]> = {
  "chat-today": [
    {
      id: "m1",
      role: "assistant",
      createdAtLabel: "14:30",
      parts: [
        {
          type: "text",
          id: "t1",
          text: "안녕하세요 수연님. 오늘은 두통과 피로가 같이 있으시군요. 증상이 심해지거나 시야 변화가 있으면 바로 진료를 권합니다.",
        },
        {
          type: "deepLink",
          id: "dl1",
          title: "두통 위험 신호 보기",
          description: "앱 안의 위험 신호 체크리스트로 이동합니다.",
          target: "knowledge",
          entityId: "headache-alert",
        },
      ],
    },
    {
      id: "m2",
      role: "assistant",
      createdAtLabel: "14:31",
      parts: [
        {
          type: "carousel",
          id: "c1",
          title: "오늘 바로 확인할 것",
          cards: [
            {
              id: "cc1",
              eyebrow: "체크 1",
              title: "수분 섭취",
              description: "짧은 간격으로 물을 자주 마셔 주세요.",
            },
            {
              id: "cc2",
              eyebrow: "체크 2",
              title: "휴식",
              description: "조명이 강한 공간은 피하고 10분 정도 쉬어 보세요.",
            },
            {
              id: "cc3",
              eyebrow: "체크 3",
              title: "증상 기록",
              description: "통증 지속 시간과 동반 증상을 기록해 두세요.",
            },
          ],
        },
      ],
    },
  ],
  "chat-vitamins": [
    {
      id: "m3",
      role: "assistant",
      createdAtLabel: "어제",
      parts: [
        {
          type: "text",
          id: "t2",
          text: "철분제는 공복에 복용하면 속이 불편할 수 있어요. 간단한 간식 뒤에 복용해도 괜찮습니다.",
        },
        {
          type: "survey",
          id: "s1",
          title: "복용 패턴 확인",
          body: "현재 가장 불편한 상황을 하나 골라 주세요.",
          choices: [
            { id: "choice-1", label: "속이 메스꺼워요" },
            { id: "choice-2", label: "변비가 심해요" },
            { id: "choice-3", label: "복용 시간을 자꾸 놓쳐요" },
          ],
        },
      ],
    },
  ],
  "chat-work": [
    {
      id: "m4",
      role: "assistant",
      createdAtLabel: "3일 전",
      parts: [
        {
          type: "image",
          id: "img1",
          imageUrl:
            "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
          alt: "산모가 의자에 기대어 쉬는 장면",
          caption: "허리와 골반 부담을 줄이는 자세 가이드",
        },
      ],
    },
  ],
};

const linkMap: Record<string, LinkTargetContent> = {
  "knowledge:headache-alert": {
    title: "두통 위험 신호",
    section: "임신 지식",
    body: "시야 변화, 심한 부종, 갑작스러운 극심한 두통이 동반되면 즉시 진료가 필요합니다. 기록을 남기고 병원 또는 응급실 안내를 우선 확인하세요.",
    ctaLabel: "임신 지식으로 이동",
  },
  "notebook:visit-checklist": {
    title: "진료 전 체크리스트",
    section: "임신수첩",
    body: "최근 증상 시작 시점, 복용 약, 통증 위치, 태동 변화 여부를 적어 두면 진료에 도움이 됩니다.",
    ctaLabel: "임신수첩으로 이동",
  },
};

const contentItemMap: Record<"knowledge" | "notebook", MobileContentListItem[]> = {
  knowledge: [
    {
      id: "headache-alert",
      slug: "headache-alert",
      section: "knowledge",
      title: "두통 위험 신호",
      preview: "시야 변화, 심한 부종, 갑작스러운 극심한 두통이 있으면 즉시 진료가 필요합니다.",
    },
  ],
  notebook: [
    {
      id: "visit-checklist",
      slug: "visit-checklist",
      section: "notebook",
      title: "진료 전 체크리스트",
      preview: "최근 증상 시작 시점, 복용 약, 통증 위치, 태동 변화를 기록해 두세요.",
    },
  ],
};

const adminUserActions: AdminUserAction[] = [
  {
    id: "action-1",
    userId: "u1",
    userName: "김수연",
    actionType: "login_succeeded",
    actionLabel: "로그인 완료",
    detail: "문자 인증 후 세션을 발급했습니다.",
    occurredAtLabel: "오늘 14:24",
    sessionId: null,
    sessionTitle: null,
  },
  {
    id: "action-2",
    userId: "u1",
    userName: "김수연",
    actionType: "chat_message_sent",
    actionLabel: "채팅 메시지 전송",
    detail: "두통과 피로가 같이 와요.",
    occurredAtLabel: "오늘 14:28",
    sessionId: "hs-1",
    sessionTitle: "두통과 피로 채팅",
  },
  {
    id: "action-3",
    userId: "u1",
    userName: "김수연",
    actionType: "profile_updated",
    actionLabel: "프로필 업데이트",
    detail: "아기 태명과 알림 시간을 수정했습니다.",
    occurredAtLabel: "어제 18:12",
    sessionId: null,
    sessionTitle: null,
  },
  {
    id: "action-4",
    userId: "u2",
    userName: "박지안",
    actionType: "onboarding_completed",
    actionLabel: "온보딩 완료",
    detail: "출산예정일과 말투 설정을 저장했습니다.",
    occurredAtLabel: "오늘 09:08",
    sessionId: null,
    sessionTitle: null,
  },
];

let mockRagDocuments: AdminRagDocumentDetail[] = [
  {
    id: "doc-18w",
    title: "18주차 두통 및 혈압 경고 신호",
    pregnancyWeekLabel: "18주차",
    pregnancyWeek: 18,
    category: "위험 신호",
    chunkCount: 14,
    updatedAt: "오늘 11:20",
    status: "ready",
    content:
      "18주차 두통과 혈압 상승 위험 신호를 우선 안내합니다. 시야 변화와 부종이 동반되면 즉시 진료가 필요합니다.",
  },
  {
    id: "doc-20w",
    title: "20주차 영양 및 철분 관리",
    pregnancyWeekLabel: "20주차",
    pregnancyWeek: 20,
    category: "영양",
    chunkCount: 9,
    updatedAt: "어제 16:10",
    status: "ready",
    content:
      "20주차에는 철분과 단백질 섭취를 꾸준히 유지하고 속 불편이 있으면 복용 시간을 조절합니다.",
  },
  {
    id: "doc-common",
    title: "공통 응급 내원 가이드",
    pregnancyWeekLabel: "공통",
    pregnancyWeek: null,
    category: "응급",
    chunkCount: 6,
    updatedAt: "3일 전",
    status: "draft",
    content:
      "공통 응급 신호를 정리한 문서입니다. 출혈, 호흡곤란, 극심한 통증은 즉시 진료를 권합니다.",
  },
];

let mockWorkflowRules: AdminWorkflowRule[] = [
  {
    id: "wf-chat-default",
    name: "기본 채팅 응답",
    trigger: "일반 채팅",
    retrievalScope: "현재 주차 ±1주 + 공통 문서",
    modelName: "gemini-2.5-flash-lite",
    status: "active",
  },
  {
    id: "wf-image-triage",
    name: "이미지 동반 채팅",
    trigger: "이미지 + 텍스트 입력",
    retrievalScope: "위험 신호 문서 우선",
    modelName: "gemini-2.5-flash-lite",
    status: "review",
  },
];

function toSession(sessionId: string): ChatSession {
  return {
    id: sessionId,
    title:
      recentChats.find((item) => item.id === sessionId)?.title ?? "새 채팅",
    messages: baseMessages[sessionId] ?? [],
  };
}

export class MockAuthAdapter implements AuthPort {
  async requestPhoneVerification(input: {
    phoneNumber: string;
  }): Promise<void> {
    if (input.phoneNumber !== mockAuthState.user.phoneNumber) {
      throw new Error("등록된 전화번호를 찾을 수 없습니다.");
    }
  }

  async signInWithPhoneVerification(input: {
    phoneNumber: string;
    verificationCode: string;
  }): Promise<AuthenticatedUser> {
    if (
      input.phoneNumber !== mockAuthState.user.phoneNumber ||
      input.verificationCode.trim().length < 4
    ) {
      throw new Error("인증 코드를 확인해 주세요.");
    }

    return { ...mockAuthState.user };
  }
}

export class MockOnboardingAdapter implements OnboardingPort {
  async completeProfile(
    input: OnboardingProfileInput,
  ): Promise<AuthenticatedUser> {
    mockAuthState.onboardingInput = input;
    mockAuthState.user = {
      ...mockAuthState.user,
      hasCompletedOnboarding: true,
    };

    return { ...mockAuthState.user };
  }
}

export class MockMobileHomeAdapter implements MobileHomePort {
  async getHomeView(): Promise<HomeViewData> {
    return {
      userName: "수연",
      pregnancyDayCount: 132,
      pregnancyWeekLabel: "18주 6일",
      currentMonthLabel: "2026년 3월",
      calendarDays: buildCalendar(),
      notebookCard: {
        id: "notebook",
        title: "임신수첩",
        description: "진료 전 체크리스트와 메모를 정리합니다.",
        href: "/(tabs)/notebook",
      },
      knowledgeCard: {
        id: "knowledge",
        title: "임신 지식",
        description: "주차별 지식과 위험 신호를 확인합니다.",
        href: "/(tabs)/knowledge",
      },
    };
  }
}

export class MockMobileChatAdapter implements MobileChatPort {
  async listRecentChats(): Promise<RecentChatSummary[]> {
    return recentChats;
  }

  async getSession(sessionId = "chat-today"): Promise<ChatSession> {
    return toSession(sessionId);
  }

  async sendMessage(input: ChatComposerInput): Promise<ChatMessage> {
    return {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      createdAtLabel: "방금 전",
      parts: [
        {
          type: "text",
          id: `assistant-text-${Date.now()}`,
          text: "지금은 목업 응답입니다. 실제 Gemini 연결 시 증상 요약, 카드 캐러셀, 내부 링크가 함께 내려옵니다.",
        },
        {
          type: "deepLink",
          id: `assistant-link-${Date.now()}`,
          title: "진료 전 체크리스트",
          description: "임신수첩의 체크리스트로 이동합니다.",
          target: "notebook",
          entityId: "visit-checklist",
        },
      ],
    };
  }

  async resolveLink(
    target: string,
    entityId?: string,
  ): Promise<LinkTargetContent> {
    return (
      linkMap[`${target}:${entityId ?? ""}`] ?? {
        title: "연결된 정보",
        section: target === "knowledge" ? "임신 지식" : "임신수첩",
        body: "연결된 콘텐츠를 준비 중입니다.",
      }
    );
  }
}

export class MockAdminDashboardAdapter implements AdminDashboardPort {
  async getDashboard(): Promise<AdminDashboardData> {
    return {
      metrics: [
        {
          id: "active-users",
          label: "활성 사용자",
          value: "184",
          changeLabel: "+12 이번 주",
        },
        {
          id: "daily-chats",
          label: "일일 채팅",
          value: "1,284",
          changeLabel: "+8% 어제 대비",
        },
        {
          id: "recovery",
          label: "계정 복구 요청",
          value: "7",
          changeLabel: "2건 처리 대기",
        },
      ],
      managedUsers: [
        {
          id: "u1",
          name: "김수연",
          phoneNumber: "010-2345-6789",
          status: "attention",
          latestIssue: "전화번호 변경 요청",
        },
        {
          id: "u2",
          name: "박지안",
          phoneNumber: "010-9999-1111",
          status: "active",
          latestIssue: "최근 로그인 정상",
        },
        {
          id: "u3",
          name: "이하은",
          phoneNumber: "010-2222-4444",
          status: "paused",
          latestIssue: "세션 초기화 필요",
        },
      ],
      recoveryActions: [
        {
          id: "r1",
          userName: "김수연",
          action: "전화번호 변경",
          requestedAt: "오늘 14:10",
          status: "pending",
        },
        {
          id: "r2",
          userName: "이하은",
          action: "세션 초기화",
          requestedAt: "오늘 09:20",
          status: "completed",
        },
      ],
      ragDocuments: mockRagDocuments.map((document) => ({
        id: document.id,
        title: document.title,
        pregnancyWeekLabel: document.pregnancyWeekLabel,
        category: document.category,
        chunkCount: document.chunkCount,
        updatedAt: document.updatedAt,
        status: document.status,
      })),
      workflowRules: mockWorkflowRules,
      historyUsers: [
        {
          id: "u1",
          name: "김수연",
          phoneNumber: "010-2345-6789",
          pregnancyWeekLabel: "18주 6일",
          latestSessionLabel: "오늘 14:31",
          sessions: [
            {
              id: "hs-1",
              title: "두통과 피로 채팅",
              updatedAtLabel: "오늘 14:31",
              pregnancyWeekLabel: "18주 6일",
              messages: [
                {
                  id: "hm-1",
                  role: "user",
                  createdAtLabel: "14:28",
                  summary: "두통과 피로가 같이 와요.",
                },
                {
                  id: "hm-2",
                  role: "assistant",
                  createdAtLabel: "14:30",
                  summary: "시야 변화 여부와 내원 권고 기준을 안내.",
                },
                {
                  id: "hm-3",
                  role: "assistant",
                  createdAtLabel: "14:31",
                  summary: "체크 카드 3장과 지식 링크 제공.",
                },
              ],
            },
            {
              id: "hs-2",
              title: "영양제 복용 채팅",
              updatedAtLabel: "어제 09:10",
              pregnancyWeekLabel: "18주 5일",
              messages: [
                {
                  id: "hm-4",
                  role: "user",
                  createdAtLabel: "09:02",
                  summary: "철분제 먹고 속이 메스꺼워요.",
                },
                {
                  id: "hm-5",
                  role: "assistant",
                  createdAtLabel: "09:10",
                  summary: "복용 패턴 설문과 간식 후 복용 가이드 안내.",
                },
              ],
            },
          ],
        },
        {
          id: "u2",
          name: "박지안",
          phoneNumber: "010-9999-1111",
          pregnancyWeekLabel: "22주 1일",
          latestSessionLabel: "오늘 10:12",
          sessions: [
            {
              id: "hs-3",
              title: "복부 뭉침 기록",
              updatedAtLabel: "오늘 10:12",
              pregnancyWeekLabel: "22주 1일",
              messages: [
                {
                  id: "hm-6",
                  role: "user",
                  createdAtLabel: "10:01",
                  summary: "오전부터 배가 자주 뭉쳐요.",
                },
                {
                  id: "hm-7",
                  role: "assistant",
                  createdAtLabel: "10:12",
                  summary: "빈도 기록과 위험 신호 체크리스트 제공.",
                },
              ],
            },
          ],
        },
      ],
      userActions: adminUserActions,
    };
  }
}

export class MockKnowledgeAdapter implements KnowledgePort {
  async listContentItems(section: "knowledge" | "notebook") {
    return contentItemMap[section] ?? [];
  }

  async getLinkTarget(target: string, entityId?: string): Promise<LinkTargetContent> {
    return (
      linkMap[`${target}:${entityId ?? ""}`] ?? {
        title: "연결된 정보",
        section: target === "knowledge" ? "임신 지식" : "임신수첩",
        body: "연결된 콘텐츠를 준비 중입니다.",
      }
    );
  }
}

const mockAllowedPhoneNumbers: AdminAllowedPhoneNumber[] = [
  {
    id: "allow-1",
    phoneNumber: "010-2345-6789",
    displayName: "김수연",
    note: "1차 파일럿",
    createdAt: "2026-03-18T09:00:00.000Z",
    updatedAt: "2026-03-18T09:00:00.000Z",
  },
  {
    id: "allow-2",
    phoneNumber: "010-9999-1111",
    displayName: "박지안",
    note: "대면 연구 대상",
    createdAt: "2026-03-18T09:10:00.000Z",
    updatedAt: "2026-03-18T09:10:00.000Z",
  },
];

export class MockAdminUserAdapter implements AdminUserPort {
  async listUsers(): Promise<AdminDashboardData["managedUsers"]> {
    const dashboard = await new MockAdminDashboardAdapter().getDashboard();
    return dashboard.managedUsers;
  }

  async listAllowedPhoneNumbers(): Promise<AdminAllowedPhoneNumber[]> {
    return mockAllowedPhoneNumbers;
  }

  async createAllowedPhoneNumber(input: {
    phoneNumber: string;
    displayName?: string | null;
    note?: string | null;
  }): Promise<AdminAllowedPhoneNumber> {
    const nextEntry: AdminAllowedPhoneNumber = {
      id: `allow-${Date.now()}`,
      phoneNumber: input.phoneNumber,
      displayName: input.displayName ?? null,
      note: input.note ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockAllowedPhoneNumbers.unshift(nextEntry);
    return nextEntry;
  }

  async updateAllowedPhoneNumber(input: {
    id: string;
    phoneNumber: string;
    displayName?: string | null;
    note?: string | null;
  }): Promise<AdminAllowedPhoneNumber> {
    const current =
      mockAllowedPhoneNumbers.find((entry) => entry.id === input.id) ??
      mockAllowedPhoneNumbers[0];
    const nextEntry: AdminAllowedPhoneNumber = {
      ...current,
      id: input.id,
      phoneNumber: input.phoneNumber,
      displayName: input.displayName ?? null,
      note: input.note ?? null,
      updatedAt: new Date().toISOString(),
    };
    const index = mockAllowedPhoneNumbers.findIndex((entry) => entry.id === input.id);
    if (index >= 0) {
      mockAllowedPhoneNumbers[index] = nextEntry;
    } else {
      mockAllowedPhoneNumbers.unshift(nextEntry);
    }
    return nextEntry;
  }

  async deleteAllowedPhoneNumber(input: { id: string }): Promise<void> {
    const index = mockAllowedPhoneNumbers.findIndex((entry) => entry.id === input.id);
    if (index >= 0) {
      mockAllowedPhoneNumbers.splice(index, 1);
    }
  }

  async updatePhoneNumber(): Promise<void> {
    return;
  }

  async resetSession(): Promise<void> {
    return;
  }
}

const mockWeekContent: AdminWeekDetail[] = [
  {
    id: "week-1",
    weekNumber: 1,
    title: "처음의 변화",
    babySizeLabel: "블루베리",
    babySizeCompareObject: "작은 블루베리",
    babySummary: "초기에 빠르게 심장이 생성되고 있어요.",
    motherSummary: "약간의 피로와 감정 기복을 느낄 수 있어요.",
    heroImagePath: "/images/week1/hero.jpg",
    compareImagePath: "/images/week1/compare.png",
    status: "published",
    updatedAt: "2026-03-17T10:00:00.000Z",
    days: [
      {
        id: "day-1",
        dayNumber: 1,
        title: "Day 1",
        babyDevelopmentItems: ["아주 작은 크기로 빠르게 성장하고 있어요."],
        babyMessage: "엄마, 반가워요.",
        motherChangesItems: ["몸이 조금 예민하게 느껴질 수 있어요."],
        displayOrder: 1,
      },
    ],
    sections: [
      {
        id: "section-1",
        dayNumber: 1,
        sectionKey: "baby_growth",
        title: "아기의 성장",
        body: "배가 커진 것처럼 느껴질 수 있어요.",
        displayOrder: 1,
        isRequired: true,
        isActive: true,
      },
    ],
    assets: [
      {
        id: "asset-1",
        dayNumber: 1,
        assetType: "hero",
        storagePath: "/assets/week1/hero.jpg",
        altText: "Week 1 hero",
        styleKey: "soft-glow",
        displayOrder: 1,
        isRequired: false,
        isActive: true,
      },
    ],
    media: [
      {
        id: "media-1",
        dayNumber: null,
        mediaScope: "week",
        bucketId: "pregnancy-content",
        objectPath: "weeks/1/hero.jpg",
        mediaRole: "hero",
        altText: "1주차 대표 이미지",
        sourceFileName: "week1-hero.jpg",
        displayOrder: 1,
      },
    ],
  },
  {
    id: "week-2",
    weekNumber: 2,
    title: "움직임이 시작돼요",
    babySizeLabel: "체리",
    babySizeCompareObject: "작은 체리",
    babySummary: "감각이 조금씩 발달하고 있어요.",
    motherSummary: "유방이 민감해질 수 있어요.",
    heroImagePath: null,
    compareImagePath: "/assets/week2/compare.jpg",
    status: "draft",
    updatedAt: "2026-03-18T09:00:00.000Z",
    days: [
      {
        id: "day-2-1",
        dayNumber: 1,
        title: "Day 1",
        babyDevelopmentItems: ["감각이 조금씩 발달하고 있어요."],
        babyMessage: null,
        motherChangesItems: ["유방이 민감해질 수 있어요."],
        displayOrder: 1,
      },
      {
        id: "day-2-2",
        dayNumber: 2,
        title: "Day 2",
        babyDevelopmentItems: ["작은 움직임이 시작돼요."],
        babyMessage: null,
        motherChangesItems: ["피로가 이어질 수 있어요."],
        displayOrder: 2,
      },
    ],
    sections: [
      {
        id: "section-2",
        dayNumber: 1,
        sectionKey: "attachment_question",
        title: "애착 질문",
        body: "오늘 느낀 감정을 적어보세요.",
        displayOrder: 1,
        isRequired: false,
        isActive: true,
      },
      {
        id: "section-3",
        dayNumber: 2,
        sectionKey: "baby_appearance",
        title: "아기 모양",
        body: "작은 체리처럼 생겼어요.",
        displayOrder: 2,
        isRequired: true,
        isActive: true,
      },
    ],
    assets: [
      {
        id: "asset-2",
        dayNumber: 1,
        assetType: "compare",
        storagePath: "/assets/week2/compare.jpg",
        altText: "Compare spotlight",
        styleKey: null,
        displayOrder: 1,
        isRequired: false,
        isActive: true,
      },
      {
        id: "asset-3",
        dayNumber: 2,
        assetType: "hero",
        storagePath: "/assets/week2/hero.jpg",
        altText: "Hero spotlight",
        styleKey: "liquid-glass",
        displayOrder: 2,
        isRequired: false,
        isActive: true,
      },
    ],
    media: [
      {
        id: "media-2",
        dayNumber: 1,
        mediaScope: "day",
        bucketId: "pregnancy-content",
        objectPath: "weeks/2/day-01/reference.jpg",
        mediaRole: "reference",
        altText: "2주차 day1 참고 이미지",
        sourceFileName: "week2-day1.jpg",
        displayOrder: 1,
      },
    ],
  },
];

let mockWeekSummaries: AdminWeekSummary[] = mockWeekContent.map((week) => ({
  id: week.id,
  weekNumber: week.weekNumber,
  title: week.title,
  babySizeLabel: week.babySizeLabel,
  babySizeCompareObject: week.babySizeCompareObject,
  babySummary: week.babySummary,
  motherSummary: week.motherSummary,
  heroImagePath: week.heroImagePath,
  compareImagePath: week.compareImagePath,
  status: week.status,
  updatedAt: week.updatedAt,
}));

let mockWeekDetailMap: Record<number, AdminWeekDetail> = Object.fromEntries(
  mockWeekContent.map((week) => [week.weekNumber, week]),
);

let mockKnowledgeItems: AdminKnowledgeItem[] = [
  {
    id: "knowledge-item-1",
    slug: "warning-signs",
    section: "knowledge",
    title: "24주차 위험 신호",
    body: "규칙적인 수축, 양수 유출 의심, 선명한 출혈은 즉시 확인이 필요합니다.",
    status: "published",
    updatedAt: "2026-03-18T09:20:00.000Z",
  },
  {
    id: "knowledge-item-2",
    slug: "visit-checklist",
    section: "notebook",
    title: "진료 전 체크리스트",
    body: "통증 시작 시각, 지속 시간, 출혈 여부, 태동 변화를 기록해 두세요.",
    status: "published",
    updatedAt: "2026-03-18T09:25:00.000Z",
  },
];

function toPregnancyWeekLabel(week: number | null) {
  return week ? `${week}주차` : "공통";
}

function mapRagDocumentDetail(
  input: AdminRagDocumentInput,
  current?: AdminRagDocumentDetail,
): AdminRagDocumentDetail {
  const updatedAt = new Date().toISOString();
  return {
    id: current?.id ?? `doc-${Date.now()}`,
    title: input.title,
    pregnancyWeekLabel: toPregnancyWeekLabel(input.pregnancyWeek),
    pregnancyWeek: input.pregnancyWeek,
    category: input.category,
    chunkCount: current?.chunkCount ?? 1,
    updatedAt,
    status: current?.status ?? "ready",
    content: input.content,
  };
}

function mapMockSectionInput(input: AdminWeekSectionInput): AdminWeekSection {
  return {
    id: input.id ?? `section-${input.sectionKey}-${input.displayOrder}`,
    dayNumber: input.dayNumber,
    sectionKey: input.sectionKey,
    title: input.title,
    body: input.body,
    displayOrder: input.displayOrder,
    isRequired: input.isRequired,
    isActive: input.isActive,
  };
}

function mapMockAssetInput(input: AdminWeekAssetInput): AdminWeekAsset {
  return {
    id: input.id ?? `asset-${input.assetType}-${input.displayOrder}`,
    dayNumber: input.dayNumber,
    assetType: input.assetType,
    storagePath: input.storagePath,
    altText: input.altText,
    styleKey: input.styleKey,
    displayOrder: input.displayOrder,
    isRequired: input.isRequired,
    isActive: input.isActive,
  };
}

function mapMockDayInput(input: AdminWeekDayInput): AdminWeekDay {
  return {
    id: input.id ?? `day-${input.dayNumber}`,
    dayNumber: input.dayNumber,
    title: input.title,
    babyDevelopmentItems: [...input.babyDevelopmentItems],
    babyMessage: input.babyMessage,
    motherChangesItems: [...input.motherChangesItems],
    displayOrder: input.displayOrder,
  };
}

function mapMockMediaInput(input: AdminWeekMediaInput): AdminWeekMedia {
  return {
    id:
      input.id ??
      `media-${input.mediaScope}-${input.dayNumber ?? "week"}-${input.displayOrder}`,
    dayNumber: input.dayNumber,
    mediaScope: input.mediaScope,
    bucketId: input.bucketId,
    objectPath: input.objectPath,
    mediaRole: input.mediaRole,
    altText: input.altText,
    sourceFileName: input.sourceFileName,
    displayOrder: input.displayOrder,
  };
}

export class MockAdminContentAdapter implements AdminContentPort {
  async createDocument(
    input: AdminRagDocumentInput,
  ): Promise<AdminRagDocumentDetail> {
    const nextDocument = mapRagDocumentDetail(input);
    mockRagDocuments = [nextDocument, ...mockRagDocuments];
    return nextDocument;
  }

  async getDocument(documentId: string): Promise<AdminRagDocumentDetail | null> {
    return (
      mockRagDocuments.find((document) => document.id === documentId) ?? null
    );
  }

  async updateDocument(
    documentId: string,
    input: AdminRagDocumentInput,
  ): Promise<AdminRagDocumentDetail | null> {
    const current = mockRagDocuments.find((document) => document.id === documentId);
    if (!current) {
      return null;
    }

    const nextDocument = mapRagDocumentDetail(input, current);
    mockRagDocuments = mockRagDocuments.map((document) =>
      document.id === documentId ? nextDocument : document,
    );
    return nextDocument;
  }

  async deleteDocument(documentId: string): Promise<void> {
    mockRagDocuments = mockRagDocuments.filter(
      (document) => document.id !== documentId,
    );
  }

  async updateWorkflowRule(
    id: string,
    input: AdminWorkflowRuleInput,
  ): Promise<AdminWorkflowRule | null> {
    const current = mockWorkflowRules.find((rule) => rule.id === id);
    if (!current) {
      return null;
    }

    const nextRule: AdminWorkflowRule = {
      ...current,
      ...input,
    };
    mockWorkflowRules = mockWorkflowRules.map((rule) =>
      rule.id === id ? nextRule : rule,
    );
    return nextRule;
  }

  async listKnowledgeItems(): Promise<AdminKnowledgeItem[]> {
    return mockKnowledgeItems;
  }

  async createKnowledgeItem(
    input: AdminKnowledgeItemInput,
  ): Promise<AdminKnowledgeItem> {
    const nextItem: AdminKnowledgeItem = {
      id: `knowledge-item-${Date.now()}`,
      slug: input.slug,
      section: input.section,
      title: input.title,
      body: input.body,
      status: input.status,
      updatedAt: new Date().toISOString(),
    };
    mockKnowledgeItems = [nextItem, ...mockKnowledgeItems];
    return nextItem;
  }

  async updateKnowledgeItem(
    id: string,
    input: AdminKnowledgeItemInput,
  ): Promise<AdminKnowledgeItem | null> {
    const existing = mockKnowledgeItems.find((item) => item.id === id);
    if (!existing) {
      return null;
    }

    const nextItem: AdminKnowledgeItem = {
      ...existing,
      slug: input.slug,
      section: input.section,
      title: input.title,
      body: input.body,
      status: input.status,
      updatedAt: new Date().toISOString(),
    };
    mockKnowledgeItems = mockKnowledgeItems.map((item) =>
      item.id === id ? nextItem : item,
    );
    return nextItem;
  }

  async deleteKnowledgeItem(id: string): Promise<void> {
    mockKnowledgeItems = mockKnowledgeItems.filter((item) => item.id !== id);
  }

  async listWeeks(): Promise<AdminWeekSummary[]> {
    return mockWeekSummaries;
  }

  async getWeek(weekNumber: number): Promise<AdminWeekDetail | null> {
    return mockWeekDetailMap[weekNumber] ?? null;
  }

  async saveWeek(
    weekNumber: number,
    input: AdminWeekUpdateInput,
  ): Promise<AdminWeekDetail | null> {
    const current = mockWeekDetailMap[weekNumber];
    if (!current) {
      return null;
    }

    const nextDetail: AdminWeekDetail = {
      ...current,
      title: input.title,
      babySizeLabel: input.babySizeLabel,
      babySizeCompareObject: input.babySizeCompareObject,
      babySummary: input.babySummary,
      motherSummary: input.motherSummary,
      heroImagePath: input.heroImagePath,
      compareImagePath: input.compareImagePath,
      status: input.status,
      updatedAt: new Date().toISOString(),
      days: input.days.map(mapMockDayInput),
      sections: input.sections.map(mapMockSectionInput),
      assets: input.assets.map(mapMockAssetInput),
      media: input.media.map(mapMockMediaInput),
    };

    mockWeekDetailMap = {
      ...mockWeekDetailMap,
      [weekNumber]: nextDetail,
    };
    mockWeekSummaries = mockWeekSummaries.map((week) =>
      week.weekNumber === weekNumber
        ? {
            ...week,
            title: nextDetail.title,
            babySizeLabel: nextDetail.babySizeLabel,
            babySizeCompareObject: nextDetail.babySizeCompareObject,
            babySummary: nextDetail.babySummary,
            motherSummary: nextDetail.motherSummary,
            heroImagePath: nextDetail.heroImagePath,
            compareImagePath: nextDetail.compareImagePath,
            status: nextDetail.status,
            updatedAt: nextDetail.updatedAt,
          }
        : week,
    );

    return nextDetail;
  }
}
