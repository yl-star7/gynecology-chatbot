import {
  supabaseDelete,
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "@/lib/mobile/supabase-rest";
import { embedPregnancyDocument } from "@/lib/mobile/rag";
import { SupabaseAdminContentPortAdapter } from "./supabase-admin-content-port";

jest.mock("@/lib/mobile/supabase-rest", () => ({
  supabaseDelete: jest.fn(),
  supabaseSelect: jest.fn(),
  supabaseInsert: jest.fn(),
  supabaseUpdate: jest.fn(),
}));

jest.mock("@/lib/mobile/rag", () => ({
  embedPregnancyDocument: jest.fn(),
}));

const mockedDelete = supabaseDelete as jest.MockedFunction<
  typeof supabaseDelete
>;
const mockedSelect = supabaseSelect as jest.MockedFunction<
  typeof supabaseSelect
>;
const mockedInsert = supabaseInsert as jest.MockedFunction<
  typeof supabaseInsert
>;
const mockedUpdate = supabaseUpdate as jest.MockedFunction<
  typeof supabaseUpdate
>;
const mockedEmbedPregnancyDocument = embedPregnancyDocument as jest.MockedFunction<
  typeof embedPregnancyDocument
>;

describe("SupabaseAdminContentPortAdapter", () => {
  const adapter = new SupabaseAdminContentPortAdapter();

  afterEach(() => {
    mockedDelete.mockReset();
    mockedSelect.mockReset();
    mockedInsert.mockReset();
    mockedUpdate.mockReset();
    mockedEmbedPregnancyDocument.mockReset();
  });

  it("maps week summaries from Supabase rows", async () => {
    mockedSelect.mockResolvedValueOnce([
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
        heroImagePath: "위험 신호 정리",
        compareImagePath: "권장 액션 정리",
        status: "published",
        updatedAt: "2026-03-17T10:00:00.000Z",
      },
    ]);
    expect(mockedSelect).toHaveBeenCalledWith(
      expect.stringContaining("content.pregnancy_week_data"),
    );
  });

  it("returns detailed week content with ordered sections and assets", async () => {
    mockedSelect.mockImplementation((path: string) => {
      if (path.startsWith("content.pregnancy_week_data")) {
        return Promise.resolve([
          {
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
          },
        ]);
      }

      if (path.startsWith("content.pregnancy_day_contents")) {
        return Promise.resolve([
          {
            id: "day-2-1",
            day_number: 1,
            title: "Day 1",
            baby_development_payload: { items: ["병아리처럼 작은 심장이 움직입니다."] },
            baby_message: "엄마, 반가워요.",
            mother_changes_payload: { items: ["유방이 민감해질 수 있습니다."] },
            display_order: 1,
          },
        ]);
      }

      if (path.startsWith("content.week_checklists")) {
        return Promise.resolve([
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
        ]);
      }

      if (path.startsWith("content.week_questions")) {
        return Promise.resolve([
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
        ]);
      }

      if (path.startsWith("content.pregnancy_week_media")) {
        return Promise.resolve([
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
        ]);
      }

      return Promise.resolve([]);
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
    expect(detail?.id).toBe("week-2");
  });

  it("returns null when the week is missing", async () => {
    mockedSelect.mockResolvedValueOnce([]);
    const detail = await adapter.getWeek(99);
    expect(detail).toBeNull();
  });

  it("saves week metadata, sections, and assets", async () => {
    mockedSelect.mockImplementation((path: string) => {
      if (path.startsWith("content.pregnancy_week_data")) {
        return Promise.resolve([
          {
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
          },
        ]);
      }

      if (path.startsWith("content.pregnancy_day_contents")) {
        return Promise.resolve([
          {
            id: "day-existing",
            day_number: 1,
            title: "Day 1",
            baby_development_payload: { items: ["기존 아기 본문"] },
            baby_message: "기존 아기 메시지",
            mother_changes_payload: { items: ["기존 엄마 본문"] },
            display_order: 1,
          },
        ]);
      }

      if (path.startsWith("content.week_checklists")) {
        return Promise.resolve([
          {
            id: "section-existing",
            day_number: 1,
            code: "baby_growth",
            title: "아기 성장",
            description: "기존 본문",
            display_order: 1,
            is_required: true,
            is_active: true,
          },
        ]);
      }

      if (path.startsWith("content.week_questions")) {
        return Promise.resolve([
          {
            id: "asset-existing",
            day_number: 1,
            code: "hero-card",
            question_type: "hero",
            question_text: "/images/week12/hero.jpg",
            help_text: "hero",
            display_order: 1,
            is_required: false,
            is_active: true,
          },
        ]);
      }

      if (path.startsWith("content.pregnancy_week_media")) {
        return Promise.resolve([
          {
            id: "media-existing",
            day_number: null,
            media_scope: "week",
            bucket_id: "pregnancy-content",
            object_path: "weeks/12/hero.jpg",
            media_role: "hero",
            alt_text: "hero image",
            source_file_name: "week12-hero.jpg",
            display_order: 1,
          },
        ]);
      }

      return Promise.resolve([]);
    });
    mockedUpdate.mockResolvedValue([]);
    mockedInsert.mockResolvedValue([]);

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
          id: "day-existing",
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
          id: "section-existing",
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
          id: "asset-existing",
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
          id: "media-existing",
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

    expect(mockedUpdate).toHaveBeenCalledWith(
      "content.pregnancy_day_contents?id=eq.day-existing",
      expect.objectContaining({
        baby_development_payload: { items: ["수정된 아기 본문"] },
      }),
    );
    expect(mockedUpdate).toHaveBeenCalledWith(
      "content.pregnancy_week_data?id=eq.week-12",
      expect.objectContaining({
        title: "12주차 관리본",
        baby_size_label: "자두",
        warning_signs: "/images/week12/hero-next.jpg",
        status: "published",
      }),
    );
    expect(mockedUpdate).toHaveBeenCalledWith(
      "content.week_checklists?id=eq.section-existing",
      expect.objectContaining({
        description: "수정된 본문",
      }),
    );
    expect(mockedInsert).toHaveBeenCalledWith(
      "content.week_checklists",
      expect.objectContaining({
        week_data_id: "week-12",
        code: "checklist",
      }),
    );
    expect(mockedInsert).toHaveBeenCalledWith(
      "content.week_questions",
      expect.objectContaining({
        week_data_id: "week-12",
        day_number: 1,
        question_type: "compare",
      }),
    );
    expect(mockedUpdate).toHaveBeenCalledWith(
      "content.pregnancy_week_media?id=eq.media-existing",
      expect.objectContaining({
        object_path: "weeks/12/hero-next.jpg",
        media_scope: "week",
      }),
    );
  });

  it("deletes persisted sections and assets omitted from the payload", async () => {
    mockedSelect.mockImplementation((path: string) => {
      if (path.startsWith("content.pregnancy_week_data")) {
        return Promise.resolve([
          {
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
          },
        ]);
      }

      if (path.startsWith("content.pregnancy_day_contents")) {
        return Promise.resolve([
          {
            id: "day-keep",
            day_number: 1,
            title: "Day 1",
            baby_development_payload: { items: ["keep"] },
            baby_message: null,
            mother_changes_payload: { items: ["keep"] },
            display_order: 1,
          },
          {
            id: "day-delete",
            day_number: 2,
            title: "Day 2",
            baby_development_payload: { items: ["delete"] },
            baby_message: null,
            mother_changes_payload: { items: ["delete"] },
            display_order: 2,
          },
        ]);
      }

      if (path.startsWith("content.week_checklists")) {
        return Promise.resolve([
          {
            id: "section-keep",
            day_number: 1,
            code: "baby_growth",
            title: "아기 성장",
            description: "기존 본문",
            display_order: 1,
            is_required: true,
            is_active: true,
          },
          {
            id: "section-delete",
            day_number: 2,
            code: "mother_change",
            title: "산모 변화",
            description: "삭제 대상",
            display_order: 2,
            is_required: false,
            is_active: true,
          },
        ]);
      }

      if (path.startsWith("content.week_questions")) {
        return Promise.resolve([
          {
            id: "asset-keep",
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
            id: "asset-delete",
            day_number: 2,
            code: "compare-card",
            question_type: "compare",
            question_text: "/images/week12/compare-old.jpg",
            help_text: "compare",
            display_order: 2,
            is_required: false,
            is_active: true,
          },
        ]);
      }

      if (path.startsWith("content.pregnancy_week_media")) {
        return Promise.resolve([
          {
            id: "media-keep",
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
            id: "media-delete",
            day_number: 2,
            media_scope: "day",
            bucket_id: "pregnancy-content",
            object_path: "weeks/12/day-02/compare.jpg",
            media_role: "reference",
            alt_text: "compare",
            source_file_name: "week12-day2.jpg",
            display_order: 2,
          },
        ]);
      }

      return Promise.resolve([]);
    });
    mockedUpdate.mockResolvedValue([]);
    mockedInsert.mockResolvedValue([]);
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
          id: "day-keep",
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
          id: "section-keep",
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
          id: "asset-keep",
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
          id: "media-keep",
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

    expect(mockedDelete).toHaveBeenCalledWith(
      "content.week_checklists?id=eq.section-delete",
    );
    expect(mockedDelete).toHaveBeenCalledWith(
      "content.week_questions?id=eq.asset-delete",
    );
    expect(mockedDelete).toHaveBeenCalledWith(
      "content.pregnancy_week_media?id=eq.media-delete",
    );
    expect(mockedDelete).toHaveBeenCalledWith(
      "content.pregnancy_day_contents?id=eq.day-delete",
    );
  });

  it("creates and updates rag documents", async () => {
    mockedEmbedPregnancyDocument
      .mockResolvedValueOnce([0.1, 0.2, 0.3])
      .mockResolvedValueOnce([0.4, 0.5, 0.6]);
    mockedInsert.mockResolvedValueOnce([
      {
        id: "doc-1",
        title: "두통 가이드",
        content: "본문",
        pregnancy_week: 18,
        category: "guide",
        metadata: { chunk_count: 1 },
        created_at: "2026-03-18T10:00:00.000Z",
        updated_at: "2026-03-18T10:00:00.000Z",
      },
    ]);
    mockedUpdate.mockResolvedValueOnce([
      {
        id: "doc-1",
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
    const updated = await adapter.updateDocument("doc-1", {
      title: "수정된 두통 가이드",
      pregnancyWeek: null,
      category: "warning",
      content: "수정 본문",
    });

    expect(created).toMatchObject({
      id: "doc-1",
      pregnancyWeek: 18,
      category: "guide",
    });
    expect(updated).toMatchObject({
      id: "doc-1",
      title: "수정된 두통 가이드",
      pregnancyWeek: null,
      category: "warning",
    });
    expect(mockedEmbedPregnancyDocument).toHaveBeenNthCalledWith(1, "본문");
    expect(mockedEmbedPregnancyDocument).toHaveBeenNthCalledWith(
      2,
      "수정 본문",
    );
    expect(mockedInsert).toHaveBeenCalledWith(
      "content.pregnancy_documents",
      expect.objectContaining({
        title: "두통 가이드",
        pregnancy_week: 18,
        embedding: [0.1, 0.2, 0.3],
      }),
    );
    expect(mockedUpdate).toHaveBeenCalledWith(
      "content.pregnancy_documents?id=eq.doc-1",
      expect.objectContaining({
        title: "수정된 두통 가이드",
        category: "warning",
        embedding: [0.4, 0.5, 0.6],
      }),
    );
  });

  it("deletes rag documents and updates workflow rules", async () => {
    mockedDelete.mockResolvedValueOnce([]);
    mockedSelect.mockResolvedValueOnce([
      {
        id: "wf-1",
        name: "기본 응답",
        slug: "default-chat",
        provider: "flowise",
        status: "published",
        is_active: true,
        config: { modelName: "gemini-2.5-flash-lite" },
        metadata: { trigger: "일반 채팅" },
        updated_at: "2026-03-18T10:00:00.000Z",
      },
    ]);
    mockedUpdate.mockResolvedValueOnce([
      {
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
      },
    ]);

    await adapter.deleteDocument("doc-1");
    const updatedRule = await adapter.updateWorkflowRule("wf-1", {
      name: "수정된 기본 응답",
      trigger: "복통",
      retrievalScope: "응급 문서 우선",
      modelName: "gemini-2.5-pro",
      status: "review",
    });

    expect(mockedDelete).toHaveBeenCalledWith(
      "content.pregnancy_documents?id=eq.doc-1",
    );
    expect(updatedRule).toMatchObject({
      id: "wf-1",
      name: "수정된 기본 응답",
      modelName: "gemini-2.5-pro",
      status: "review",
    });
  });
});
