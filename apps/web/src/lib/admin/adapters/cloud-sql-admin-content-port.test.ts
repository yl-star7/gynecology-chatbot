import { dbDelete, dbInsert, dbSelect, dbUpdate } from "@/lib/db/admin-client";
import { embedPregnancyDocument } from "@/lib/mobile/rag";
import { getSchiftClient } from "@/lib/mobile/schift-client";
import { patchSchiftWorkflow } from "@/lib/mobile/schift-workflows-api";
import {
  hasDockerConfig,
  resolveServerDataProvider,
} from "@/lib/server-data-provider";
import { CloudSqlAdminContentPortAdapter } from "./cloud-sql-admin-content-port";

var mockedPrisma: any;

const mockedWeekRepositoryListWeeks = jest.fn();
const mockedWeekRepositoryGetWeek = jest.fn();
const mockedWeekRepositoryGetWeekChildren = jest.fn();
const mockedWeekRepositoryUpdateWeekSummary = jest.fn();
const mockedWeekRepositoryUpsertDayContents = jest.fn();
const mockedWeekRepositoryUpsertChecklists = jest.fn();
const mockedWeekRepositoryUpsertQuestions = jest.fn();
const mockedWeekRepositoryUpsertMedia = jest.fn();
const mockedWeekRepositoryDeleteDay = jest.fn();
const mockedWeekRepositoryDeleteChecklist = jest.fn();
const mockedWeekRepositoryDeleteQuestion = jest.fn();
const mockedWeekRepositoryDeleteMedia = jest.fn();

jest.mock("@/lib/db/admin-client", () => ({
  dbDelete: jest.fn(),
  dbSelect: jest.fn(),
  dbInsert: jest.fn(),
  dbUpdate: jest.fn(),
}));

jest.mock("@/lib/mobile/rag", () => ({
  embedPregnancyDocument: jest.fn(),
}));

jest.mock("@/lib/mobile/schift-client", () => ({
  getSchiftClient: jest.fn(),
}));

jest.mock("@/lib/server-data-provider", () => ({
  resolveServerDataProvider: jest.fn(() => "docker"),
  hasDockerConfig: jest.fn(() => true),
}));

jest.mock("@gynecology-chatbot/db/prisma", () => {
  mockedPrisma = {
    $queryRaw: jest.fn(),
    admin_audit_logs: {
      create: jest.fn(),
    },
    content_pregnancy_documents: {
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    workflow_definitions: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    content_knowledge_items: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  return { prisma: mockedPrisma };
});

jest.mock("@/lib/mobile/schift-workflows-api", () => ({
  patchSchiftWorkflow: jest.fn(),
}));

jest.mock("@/lib/db/repositories/week-content-repository", () => ({
  WeekContentRepository: jest.fn(() => ({
    listWeeks: mockedWeekRepositoryListWeeks,
    getWeek: mockedWeekRepositoryGetWeek,
    getWeekChildren: mockedWeekRepositoryGetWeekChildren,
    updateWeekSummary: mockedWeekRepositoryUpdateWeekSummary,
    upsertDayContents: mockedWeekRepositoryUpsertDayContents,
    upsertChecklists: mockedWeekRepositoryUpsertChecklists,
    upsertQuestions: mockedWeekRepositoryUpsertQuestions,
    upsertMedia: mockedWeekRepositoryUpsertMedia,
    deleteDay: mockedWeekRepositoryDeleteDay,
    deleteChecklist: mockedWeekRepositoryDeleteChecklist,
    deleteQuestion: mockedWeekRepositoryDeleteQuestion,
    deleteMedia: mockedWeekRepositoryDeleteMedia,
  })),
}));

const mockedDelete = dbDelete as jest.MockedFunction<typeof dbDelete>;
const mockedSelect = dbSelect as jest.MockedFunction<typeof dbSelect>;
const mockedInsert = dbInsert as jest.MockedFunction<typeof dbInsert>;
const mockedUpdate = dbUpdate as jest.MockedFunction<typeof dbUpdate>;
const mockedEmbedPregnancyDocument =
  embedPregnancyDocument as jest.MockedFunction<typeof embedPregnancyDocument>;
const mockedGetSchiftClient = getSchiftClient as jest.MockedFunction<
  typeof getSchiftClient
>;
const mockedPatchSchiftWorkflow = patchSchiftWorkflow as jest.MockedFunction<
  typeof patchSchiftWorkflow
>;
const mockedHasDockerConfig = hasDockerConfig as jest.MockedFunction<
  typeof hasDockerConfig
>;
const mockedResolveServerDataProvider =
  resolveServerDataProvider as jest.MockedFunction<
    typeof resolveServerDataProvider
  >;

describe("CloudSqlAdminContentPortAdapter", () => {
  const adapter = new CloudSqlAdminContentPortAdapter();
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    process.env.DATABASE_URL = "";
    mockedHasDockerConfig.mockReturnValue(true);
    mockedResolveServerDataProvider.mockReturnValue("docker");
    mockedPrisma.content_pregnancy_documents.findMany.mockResolvedValue([]);
    mockedPrisma.workflow_definitions.findMany.mockResolvedValue([]);
    mockedPrisma.content_knowledge_items.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    mockedDelete.mockReset();
    mockedSelect.mockReset();
    mockedInsert.mockReset();
    mockedUpdate.mockReset();
    mockedEmbedPregnancyDocument.mockReset();
    mockedGetSchiftClient.mockReset();
    mockedPatchSchiftWorkflow.mockReset();
    mockedHasDockerConfig.mockReset();
    mockedResolveServerDataProvider.mockReset();
    mockedWeekRepositoryListWeeks.mockReset();
    mockedWeekRepositoryGetWeek.mockReset();
    mockedWeekRepositoryGetWeekChildren.mockReset();
    mockedWeekRepositoryUpdateWeekSummary.mockReset();
    mockedWeekRepositoryUpsertDayContents.mockReset();
    mockedWeekRepositoryUpsertChecklists.mockReset();
    mockedWeekRepositoryUpsertQuestions.mockReset();
    mockedWeekRepositoryUpsertMedia.mockReset();
    mockedWeekRepositoryDeleteDay.mockReset();
    mockedWeekRepositoryDeleteChecklist.mockReset();
    mockedWeekRepositoryDeleteQuestion.mockReset();
    mockedWeekRepositoryDeleteMedia.mockReset();
    mockedPrisma.$queryRaw.mockReset();
    mockedPrisma.admin_audit_logs.create.mockReset();
    mockedPrisma.content_pregnancy_documents.findMany.mockReset();
    mockedPrisma.content_pregnancy_documents.delete.mockReset();
    mockedPrisma.workflow_definitions.findMany.mockReset();
    mockedPrisma.workflow_definitions.update.mockReset();
    mockedPrisma.content_knowledge_items.findMany.mockReset();
    mockedPrisma.content_knowledge_items.create.mockReset();
    mockedPrisma.content_knowledge_items.update.mockReset();
    mockedPrisma.content_knowledge_items.delete.mockReset();
  });

  afterAll(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it("maps week summaries from DB rows", async () => {
    mockedResolveServerDataProvider.mockReturnValue("docker");
    mockedHasDockerConfig.mockReturnValue(true);
    mockedWeekRepositoryListWeeks.mockResolvedValueOnce([
      {
        id: "week-1",
        week_number: 1,
        title: "처음의 변화",
        baby_size_label: "블루베리",
        baby_size_compare_object: "작은 블루베리",
        baby_summary: "baby summary",
        mother_summary: "mother summary",
        warning_signs: "위험 신호 정리",
        recommended_actions: "권장 액션 정리",
        status: "published",
        updated_at: "2026-03-17T10:00:00.000Z",
      },
    ]);

    const result = await adapter.listWeeks();

    expect(result).toEqual([
      {
        id: "week-1",
        weekNumber: 1,
        title: "처음의 변화",
        babySizeLabel: "블루베리",
        babySizeCompareObject: "작은 블루베리",
        babySummary: "baby summary",
        motherSummary: "mother summary",
        heroImagePath: null,
        compareImagePath: null,
        status: "published",
        updatedAt: "2026-03-17T10:00:00.000Z",
      },
    ]);
    expect(mockedWeekRepositoryListWeeks).toHaveBeenCalled();
  });

  it("returns detailed week content with ordered sections and assets", async () => {
    mockedResolveServerDataProvider.mockReturnValue("docker");
    mockedHasDockerConfig.mockReturnValue(true);
    mockedWeekRepositoryGetWeek.mockResolvedValueOnce({
      id: "week-2",
      week_number: 2,
      title: "두 번째 주",
      baby_size_label: "체리",
      baby_size_compare_object: "작은 체리",
      baby_summary: "병아리처럼 작은 심장이 움직입니다.",
      mother_summary: "유방이 민감해질 수 있습니다.",
      warning_signs: "위험 신호 정리",
      recommended_actions: "권장 액션 정리",
      status: "draft",
      updated_at: "2026-03-18T08:00:00.000Z",
    });
    mockedWeekRepositoryGetWeekChildren.mockResolvedValueOnce({
      days: [
        {
          id: "day-2-1",
          day_number: 1,
          title: "Day 1",
          baby_development_payload: {
            items: ["병아리처럼 작은 심장이 움직입니다."],
          },
          baby_message: "엄마, 반가워요.",
          mother_changes_payload: { items: ["유방이 민감해질 수 있습니다."] },
          display_order: 1,
        },
      ],
      sections: [
        {
          id: "section-2",
          day_number: 2,
          code: "baby_appearance",
          title: "아기 모양",
          description: "작은 체리처럼 생겼어요.",
          display_order: 2,
          is_required: true,
          is_active: true,
        },
        {
          id: "section-1",
          day_number: 1,
          code: "attachment_question",
          title: "애착 질문",
          description: "오늘 느낀 감정을 적어주세요.",
          display_order: 1,
          is_required: false,
          is_active: true,
        },
      ],
      assets: [
        {
          id: "asset-2",
          day_number: 2,
          code: "compare-card",
          question_type: "compare",
          question_text: "/images/week2/compare.jpg",
          help_text: "비교 이미지",
          display_order: 2,
          is_required: false,
          is_active: true,
        },
        {
          id: "asset-1",
          day_number: 1,
          code: "hero-card",
          question_type: "hero",
          question_text: "/images/week2/hero.jpg",
          help_text: "히어로 이미지",
          display_order: 1,
          is_required: true,
          is_active: true,
        },
      ],
      media: [
        {
          id: "media-1",
          day_number: null,
          media_scope: "week",
          bucket_id: "pregnancy-content",
          object_path: "weeks/2/hero.jpg",
          media_role: "hero",
          alt_text: "주차 대표 이미지",
          source_file_name: "week2-hero.jpg",
          display_order: 1,
        },
        {
          id: "media-2",
          day_number: null,
          media_scope: "week",
          bucket_id: "pregnancy-content",
          object_path: "weeks/2/compare.jpg",
          media_role: "compare",
          alt_text: "주차 비교 이미지",
          source_file_name: "week2-compare.jpg",
          display_order: 2,
        },
      ],
    });

    const detail = await adapter.getWeek(2);

    expect(detail).not.toBeNull();
    expect(detail?.sections.map((section) => section.sectionKey)).toEqual([
      "attachment_question",
      "baby_appearance",
    ]);
    expect(detail?.assets.map((asset) => asset.assetType)).toEqual([
      "hero",
      "compare",
    ]);
    expect(detail?.days[0]).toMatchObject({
      dayNumber: 1,
      title: "Day 1",
    });
    expect(detail?.media[0]).toMatchObject({
      mediaScope: "week",
      objectPath: "weeks/2/hero.jpg",
    });
    expect(detail).toMatchObject({
      heroImagePath: "storage://pregnancy-content/weeks/2/hero.jpg",
      compareImagePath: "storage://pregnancy-content/weeks/2/compare.jpg",
    });
    expect(detail?.id).toBe("week-2");
  });

  it("returns null when the week is missing", async () => {
    mockedResolveServerDataProvider.mockReturnValue("docker");
    mockedHasDockerConfig.mockReturnValue(true);
    mockedWeekRepositoryGetWeek.mockResolvedValueOnce(null);
    const detail = await adapter.getWeek(99);
    expect(detail).toBeNull();
  });

  it("saves week metadata, sections, and assets", async () => {
    mockedResolveServerDataProvider.mockReturnValue("docker");
    mockedHasDockerConfig.mockReturnValue(true);
    mockedWeekRepositoryGetWeek.mockResolvedValue({
      id: "week-12",
      week_number: 12,
      title: "12주차 기본",
      baby_size_label: "라임",
      baby_size_compare_object: "작은 라임",
      baby_summary: "기존 요약",
      mother_summary: "기존 엄마 요약",
      warning_signs: "기존 히어로",
      recommended_actions: "기존 비교",
      status: "draft",
      updated_at: "2026-03-18T08:00:00.000Z",
    });
    mockedWeekRepositoryGetWeekChildren.mockResolvedValue({
      days: [
        {
          id: "11111111-1111-4111-8111-aaaaaaaaaaaa",
          day_number: 1,
          title: "Day 1",
          baby_development_payload: { items: ["기존 아기 본문"] },
          baby_message: "기존 아기 메시지",
          mother_changes_payload: { items: ["기존 엄마 본문"] },
          display_order: 1,
        },
      ],
      sections: [
        {
          id: "22222222-2222-4222-8222-aaaaaaaaaaaa",
          day_number: 1,
          code: "baby_growth",
          title: "아기 성장",
          description: "기존 본문",
          display_order: 1,
          is_required: true,
          is_active: true,
        },
      ],
      assets: [
        {
          id: "33333333-3333-4333-8333-aaaaaaaaaaaa",
          day_number: 1,
          code: "hero-card",
          question_type: "hero",
          question_text: "/images/week12/hero.jpg",
          help_text: "hero",
          display_order: 1,
          is_required: false,
          is_active: true,
        },
      ],
      media: [
        {
          id: "44444444-4444-4444-8444-aaaaaaaaaaaa",
          day_number: null,
          media_scope: "week",
          bucket_id: "pregnancy-content",
          object_path: "weeks/12/hero.jpg",
          media_role: "hero",
          alt_text: "hero image",
          source_file_name: "week12-hero.jpg",
          display_order: 1,
        },
      ],
    });
    mockedWeekRepositoryUpsertDayContents.mockResolvedValue(
      new Map([[1, "11111111-1111-4111-8111-aaaaaaaaaaaa"]]),
    );

    await adapter.saveWeek(12, {
      title: "12주차 관리본",
      babySizeLabel: "자두",
      babySizeCompareObject: "붉은 자두",
      babySummary: "수정된 아기 요약",
      motherSummary: "수정된 엄마 요약",
      heroImagePath: "/images/week12/hero-next.jpg",
      compareImagePath: "/images/week12/compare-next.jpg",
      status: "published",
      days: [
        {
          id: "11111111-1111-4111-8111-aaaaaaaaaaaa",
          dayNumber: 1,
          title: "Day 1",
          babyDevelopmentItems: ["수정된 아기 본문"],
          babyMessage: "수정된 아기 메시지",
          motherChangesItems: ["수정된 엄마 본문"],
          displayOrder: 1,
        },
      ],
      sections: [
        {
          id: "22222222-2222-4222-8222-aaaaaaaaaaaa",
          dayNumber: 1,
          sectionKey: "baby_growth",
          title: "아기 성장",
          body: "수정된 본문",
          displayOrder: 1,
          isRequired: true,
          isActive: true,
        },
        {
          dayNumber: 1,
          sectionKey: "checklist",
          title: "체크리스트",
          body: "새 섹션",
          displayOrder: 2,
          isRequired: false,
          isActive: true,
        },
      ],
      assets: [
        {
          id: "33333333-3333-4333-8333-aaaaaaaaaaaa",
          dayNumber: 1,
          assetType: "hero",
          storagePath: "/images/week12/hero-next.jpg",
          altText: "새 hero",
          styleKey: "hero-card",
          displayOrder: 1,
          isRequired: false,
          isActive: true,
        },
        {
          dayNumber: 1,
          assetType: "compare",
          storagePath: "/images/week12/compare-next.jpg",
          altText: "새 compare",
          styleKey: "compare-card",
          displayOrder: 2,
          isRequired: false,
          isActive: true,
        },
      ],
      media: [
        {
          id: "44444444-4444-4444-8444-aaaaaaaaaaaa",
          dayNumber: null,
          mediaScope: "week",
          bucketId: "pregnancy-content",
          objectPath: "weeks/12/hero-next.jpg",
          mediaRole: "hero",
          altText: "주차 대표 이미지",
          sourceFileName: "week12-hero-next.jpg",
          displayOrder: 1,
        },
      ],
    });

    expect(mockedWeekRepositoryUpdateWeekSummary).toHaveBeenCalledWith(
      "week-12",
      expect.objectContaining({
        title: "12주차 관리본",
        babySizeLabel: "자두",
        heroImagePath: "/images/week12/hero-next.jpg",
        status: "published",
      }),
      null,
    );
    expect(mockedWeekRepositoryUpsertDayContents).toHaveBeenCalledWith(
      "week-12",
      expect.arrayContaining([
        expect.objectContaining({
          id: "11111111-1111-4111-8111-aaaaaaaaaaaa",
          babyDevelopmentItems: ["수정된 아기 본문"],
        }),
      ]),
      null,
    );
    expect(mockedWeekRepositoryUpsertChecklists).toHaveBeenCalledWith(
      "week-12",
      expect.arrayContaining([
        expect.objectContaining({
          id: "22222222-2222-4222-8222-aaaaaaaaaaaa",
          body: "수정된 본문",
        }),
        expect.objectContaining({
          sectionKey: "checklist",
        }),
      ]),
      expect.any(Map),
      null,
    );
    expect(mockedWeekRepositoryUpsertQuestions).toHaveBeenCalledWith(
      "week-12",
      expect.arrayContaining([
        expect.objectContaining({
          assetType: "compare",
          dayNumber: 1,
        }),
      ]),
      expect.any(Map),
      null,
    );
    expect(mockedWeekRepositoryUpsertMedia).toHaveBeenCalledWith(
      "week-12",
      expect.arrayContaining([
        expect.objectContaining({
          id: "44444444-4444-4444-8444-aaaaaaaaaaaa",
          objectPath: "weeks/12/hero-next.jpg",
          mediaScope: "week",
        }),
      ]),
      expect.any(Map),
      null,
    );
  });

  it("deletes persisted sections and assets omitted from the payload", async () => {
    mockedResolveServerDataProvider.mockReturnValue("docker");
    mockedHasDockerConfig.mockReturnValue(true);
    mockedWeekRepositoryGetWeek.mockResolvedValue({
      id: "week-12",
      week_number: 12,
      title: "12주차 기본",
      baby_size_label: "라임",
      baby_size_compare_object: "작은 라임",
      baby_summary: "기존 요약",
      mother_summary: "기존 엄마 요약",
      warning_signs: "기존 히어로",
      recommended_actions: "기존 비교",
      status: "draft",
      updated_at: "2026-03-18T08:00:00.000Z",
    });
    mockedWeekRepositoryGetWeekChildren.mockResolvedValue({
      days: [
        {
          id: "11111111-1111-4111-8111-bbbbbbbbbbbb",
          day_number: 1,
          title: "Day 1",
          baby_development_payload: { items: ["keep"] },
          baby_message: null,
          mother_changes_payload: { items: ["keep"] },
          display_order: 1,
        },
        {
          id: "11111111-1111-4111-8111-cccccccccccc",
          day_number: 2,
          title: "Day 2",
          baby_development_payload: { items: ["delete"] },
          baby_message: null,
          mother_changes_payload: { items: ["delete"] },
          display_order: 2,
        },
      ],
      sections: [
        {
          id: "22222222-2222-4222-8222-bbbbbbbbbbbb",
          day_number: 1,
          code: "baby_growth",
          title: "아기 성장",
          description: "기존 본문",
          display_order: 1,
          is_required: true,
          is_active: true,
        },
        {
          id: "22222222-2222-4222-8222-cccccccccccc",
          day_number: 2,
          code: "mother_change",
          title: "산모 변화",
          description: "삭제 대상",
          display_order: 2,
          is_required: false,
          is_active: true,
        },
      ],
      assets: [
        {
          id: "33333333-3333-4333-8333-bbbbbbbbbbbb",
          day_number: 1,
          code: "hero-card",
          question_type: "hero",
          question_text: "/images/week12/hero-next.jpg",
          help_text: "hero",
          display_order: 1,
          is_required: false,
          is_active: true,
        },
        {
          id: "33333333-3333-4333-8333-cccccccccccc",
          day_number: 2,
          code: "compare-card",
          question_type: "compare",
          question_text: "/images/week12/compare-old.jpg",
          help_text: "compare",
          display_order: 2,
          is_required: false,
          is_active: true,
        },
      ],
      media: [
        {
          id: "44444444-4444-4444-8444-bbbbbbbbbbbb",
          day_number: null,
          media_scope: "week",
          bucket_id: "pregnancy-content",
          object_path: "weeks/12/hero-next.jpg",
          media_role: "hero",
          alt_text: "hero",
          source_file_name: "week12-hero.jpg",
          display_order: 1,
        },
        {
          id: "44444444-4444-4444-8444-cccccccccccc",
          day_number: 2,
          media_scope: "day",
          bucket_id: "pregnancy-content",
          object_path: "weeks/12/day-02/compare.jpg",
          media_role: "reference",
          alt_text: "compare",
          source_file_name: "week12-day2.jpg",
          display_order: 2,
        },
      ],
    });
    mockedWeekRepositoryUpsertDayContents.mockResolvedValue(
      new Map([[1, "11111111-1111-4111-8111-bbbbbbbbbbbb"]]),
    );
    mockedDelete.mockResolvedValue([]);

    await adapter.saveWeek(12, {
      title: "12주차 관리본",
      babySizeLabel: "자두",
      babySizeCompareObject: "붉은 자두",
      babySummary: "수정된 아기 요약",
      motherSummary: "수정된 엄마 요약",
      heroImagePath: "/images/week12/hero-next.jpg",
      compareImagePath: "/images/week12/compare-next.jpg",
      status: "published",
      days: [
        {
          id: "11111111-1111-4111-8111-bbbbbbbbbbbb",
          dayNumber: 1,
          title: "Day 1",
          babyDevelopmentItems: ["유지"],
          babyMessage: null,
          motherChangesItems: ["유지"],
          displayOrder: 1,
        },
      ],
      sections: [
        {
          id: "22222222-2222-4222-8222-bbbbbbbbbbbb",
          dayNumber: 1,
          sectionKey: "baby_growth",
          title: "아기 성장",
          body: "수정된 본문",
          displayOrder: 1,
          isRequired: true,
          isActive: true,
        },
      ],
      assets: [
        {
          id: "33333333-3333-4333-8333-bbbbbbbbbbbb",
          dayNumber: 1,
          assetType: "hero",
          storagePath: "/images/week12/hero-next.jpg",
          altText: "새 hero",
          styleKey: "hero-card",
          displayOrder: 1,
          isRequired: false,
          isActive: true,
        },
      ],
      media: [
        {
          id: "44444444-4444-4444-8444-bbbbbbbbbbbb",
          dayNumber: null,
          mediaScope: "week",
          bucketId: "pregnancy-content",
          objectPath: "weeks/12/hero-next.jpg",
          mediaRole: "hero",
          altText: "hero",
          sourceFileName: "week12-hero.jpg",
          displayOrder: 1,
        },
      ],
    });

    expect(mockedWeekRepositoryDeleteChecklist).toHaveBeenCalledWith(
      "22222222-2222-4222-8222-cccccccccccc",
    );
    expect(mockedWeekRepositoryDeleteQuestion).toHaveBeenCalledWith(
      "33333333-3333-4333-8333-cccccccccccc",
    );
    expect(mockedWeekRepositoryDeleteMedia).toHaveBeenCalledWith(
      "44444444-4444-4444-8444-cccccccccccc",
    );
    expect(mockedWeekRepositoryDeleteDay).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-cccccccccccc",
    );
    expect(mockedDelete).not.toHaveBeenCalledWith(
      expect.stringContaining("undefined"),
    );
  });

  it("creates and updates rag documents", async () => {
    mockedResolveServerDataProvider.mockReturnValue("docker");
    mockedHasDockerConfig.mockReturnValue(true);
    mockedEmbedPregnancyDocument
      .mockResolvedValueOnce([0.1, 0.2, 0.3])
      .mockResolvedValueOnce([0.4, 0.5, 0.6]);
    mockedPrisma.$queryRaw.mockResolvedValueOnce([
      {
        id: "11111111-1111-4111-8111-111111111111",
        title: "두통 가이드",
        content: "본문",
        pregnancy_week: 18,
        category: "guide",
        metadata: { chunk_count: 1 },
        created_at: "2026-03-18T10:00:00.000Z",
        updated_at: "2026-03-18T10:00:00.000Z",
      },
    ]);
    mockedPrisma.$queryRaw.mockResolvedValueOnce([
      {
        id: "11111111-1111-4111-8111-111111111111",
        title: "수정된 두통 가이드",
        content: "수정 본문",
        pregnancy_week: null,
        category: "warning",
        metadata: { chunk_count: 1 },
        updated_at: "2026-03-18T11:00:00.000Z",
      },
    ]);

    const created = await adapter.createDocument({
      title: "두통 가이드",
      pregnancyWeek: 18,
      category: "guide",
      content: "본문",
    });
    const updated = await adapter.updateDocument(
      "11111111-1111-4111-8111-111111111111",
      {
        title: "수정된 두통 가이드",
        pregnancyWeek: null,
        category: "warning",
        content: "수정 본문",
      },
    );

    expect(created).toMatchObject({
      id: "11111111-1111-4111-8111-111111111111",
      pregnancyWeek: 18,
      category: "guide",
    });
    expect(updated).toMatchObject({
      id: "11111111-1111-4111-8111-111111111111",
      title: "수정된 두통 가이드",
      pregnancyWeek: null,
      category: "warning",
    });
    expect(mockedEmbedPregnancyDocument).toHaveBeenNthCalledWith(1, "본문");
    expect(mockedEmbedPregnancyDocument).toHaveBeenNthCalledWith(
      2,
      "수정 본문",
    );
    expect(mockedPrisma.$queryRaw).toHaveBeenCalledTimes(2);
  });

  it("deletes rag documents and updates workflow rules", async () => {
    mockedResolveServerDataProvider.mockReturnValue("docker");
    mockedHasDockerConfig.mockReturnValue(true);
    mockedGetSchiftClient.mockReturnValue(null);
    mockedPrisma.content_pregnancy_documents.delete.mockResolvedValueOnce({});
    mockedPrisma.workflow_definitions.findMany.mockResolvedValueOnce([
      {
        id: "wf-1",
        name: "기본 응답",
        slug: "default-chat",
        provider: "flowise",
        status: "published",
        is_active: true,
        config: { modelName: "gemini-3.1-flash-lite" },
        metadata: { trigger: "일반 채팅" },
        updated_at: "2026-03-18T10:00:00.000Z",
      },
    ]);
    mockedPrisma.workflow_definitions.update.mockResolvedValueOnce({
      id: "wf-1",
      name: "수정된 기본 응답",
      slug: "default-chat",
      provider: "flowise",
      status: "draft",
      is_active: false,
      config: {
        modelName: "gemini-2.5-pro",
        retrievalScope: "응급 문서 우선",
      },
      metadata: {
        trigger: "복통",
        retrievalScope: "응급 문서 우선",
        modelName: "gemini-2.5-pro",
      },
      updated_at: "2026-03-18T11:00:00.000Z",
    });

    await adapter.deleteDocument("11111111-1111-4111-8111-111111111111");
    const updatedRule = await adapter.updateWorkflowRule("wf-1", {
      name: "수정된 기본 응답",
      trigger: "복통",
      retrievalScope: "응급 문서 우선",
      modelName: "gemini-2.5-pro",
      status: "review",
    });

    expect(
      mockedPrisma.content_pregnancy_documents.delete,
    ).toHaveBeenCalledWith({
      where: { id: "11111111-1111-4111-8111-111111111111" },
    });
    expect(updatedRule).toMatchObject({
      id: "wf-1",
      name: "수정된 기본 응답",
      modelName: "gemini-2.5-pro",
      status: "review",
    });
  });

  it("updates Schift workflows when no local workflow row exists", async () => {
    mockedResolveServerDataProvider.mockReturnValue("docker");
    mockedHasDockerConfig.mockReturnValue(true);
    mockedPrisma.workflow_definitions.findMany.mockResolvedValueOnce([]);
    mockedGetSchiftClient.mockReturnValue({
      workflows: {
        get: jest.fn().mockResolvedValue({
          id: "schift-wf-1",
          name: "원본 플로우",
          description: "기본 설명",
          status: "draft",
          graph: { blocks: [], edges: [] },
          created_at: "2026-03-23T10:00:00.000Z",
          updated_at: "2026-03-23T10:00:00.000Z",
        }),
      },
    } as never);
    mockedPatchSchiftWorkflow.mockResolvedValue({
      id: "schift-wf-1",
      name: "Schift 응답",
      description:
        '<!-- si-admin-workflow:{"trigger":"야간 알림","retrievalScope":"주차별 문서","modelName":"gemini-3.1-flash-lite"}-->',
      status: "active",
      graph: { blocks: [], edges: [] },
      created_at: "2026-03-23T10:00:00.000Z",
      updated_at: "2026-03-23T10:10:00.000Z",
    } as never);

    const updatedRule = await adapter.updateWorkflowRule("schift-wf-1", {
      name: "Schift 응답",
      trigger: "야간 알림",
      retrievalScope: "주차별 문서",
      modelName: "gemini-3.1-flash-lite",
      status: "active",
    });

    expect(mockedPatchSchiftWorkflow).toHaveBeenCalledWith(
      "schift-wf-1",
      expect.objectContaining({
        name: "Schift 응답",
        status: "published",
        description: expect.stringContaining('"trigger":"야간 알림"'),
      }),
    );
    expect(updatedRule).toMatchObject({
      id: "schift-wf-1",
      name: "Schift 응답",
      trigger: "야간 알림",
      retrievalScope: "주차별 문서",
      modelName: "gemini-3.1-flash-lite",
      status: "active",
    });
  });

  it("updateDocument inlines previous_snapshot in the raw SQL UPDATE", async () => {
    mockedResolveServerDataProvider.mockReturnValue("docker");
    mockedHasDockerConfig.mockReturnValue(true);
    mockedEmbedPregnancyDocument.mockResolvedValueOnce([0.1, 0.2, 0.3]);
    mockedPrisma.content_pregnancy_documents.findMany.mockResolvedValueOnce([]);
    mockedPrisma.$queryRaw.mockResolvedValueOnce([
      {
        id: "11111111-1111-4111-8111-111111111111",
        title: "수정된 문서",
        content: "수정 본문",
        pregnancy_week: null,
        category: "guide",
        metadata: { chunk_count: 1 },
        updated_at: "2026-04-24T10:00:00.000Z",
      },
    ]);

    const result = await adapter.updateDocument(
      "11111111-1111-4111-8111-111111111111",
      {
        title: "수정된 문서",
        pregnancyWeek: null,
        category: "guide",
        content: "수정 본문",
      },
    );

    expect(result).not.toBeNull();
    expect(mockedPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    // The raw SQL template includes previous_snapshot subquery — verify the call happened
    const rawCallArgs = mockedPrisma.$queryRaw.mock.calls[0];
    // Tagged template literal first arg is a TemplateStringsArray
    const sqlFragments = rawCallArgs[0] as unknown as string[];
    const fullSql = sqlFragments.join(" ");
    expect(fullSql).toContain("previous_snapshot");
    expect(fullSql).toContain("row_to_json");
  });
});
