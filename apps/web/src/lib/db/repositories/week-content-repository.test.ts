import type {
  AdminWeekAssetInput,
  AdminWeekDayInput,
  AdminWeekMediaInput,
  AdminWeekSectionInput,
} from "@gynecology-chatbot/app-core";

import {
  WeekContentRepository,
  type SupabaseWeekAssetRow,
  type SupabaseWeekDayRow,
  type SupabaseWeekMediaRow,
  type SupabaseWeekRow,
  type SupabaseWeekSectionRow,
} from "./week-content-repository";

describe("WeekContentRepository", () => {
  const mockedSelect = jest.fn();
  const mockedUpdate = jest.fn();
  const mockedInsert = jest.fn();
  const mockedDelete = jest.fn();
  const mockedQueryRows = jest.fn();
  const mockedCreateId = jest
    .fn()
    .mockReturnValueOnce("11111111-1111-4111-8111-111111111111")
    .mockReturnValueOnce("22222222-2222-4222-8222-222222222222")
    .mockReturnValueOnce("33333333-3333-4333-8333-333333333333")
    .mockReturnValueOnce("44444444-4444-4444-8444-444444444444");

  const repository = new WeekContentRepository({
    select: mockedSelect,
    update: mockedUpdate,
    insert: mockedInsert,
    remove: mockedDelete,
    queryRows: mockedQueryRows,
    hasDirectContentDatabase: () => false,
    createId: mockedCreateId,
  });

  beforeEach(() => {
    mockedSelect.mockReset();
    mockedUpdate.mockReset();
    mockedInsert.mockReset();
    mockedDelete.mockReset();
    mockedQueryRows.mockReset();
    mockedCreateId.mockReset();
    mockedCreateId
      .mockReturnValueOnce("11111111-1111-4111-8111-111111111111")
      .mockReturnValueOnce("22222222-2222-4222-8222-222222222222")
      .mockReturnValueOnce("33333333-3333-4333-8333-333333333333")
      .mockReturnValueOnce("44444444-4444-4444-8444-444444444444");
  });

  it("lists week summaries from canonical public view", async () => {
    const rows: SupabaseWeekRow[] = [
      {
        id: "week-1",
        week_number: 1,
        title: "1주차",
        baby_size_label: "블루베리",
        baby_size_compare_object: "작은 블루베리",
        baby_summary: "baby",
        mother_summary: "mother",
        warning_signs: "hero",
        recommended_actions: "compare",
        status: "published",
        updated_at: "2026-03-20T10:00:00.000Z",
      },
    ];
    mockedSelect.mockResolvedValueOnce(rows);

    const result = await repository.listWeeks();

    expect(result).toEqual(rows);
    expect(mockedSelect).toHaveBeenCalledWith(
      "content_pregnancy_week_data?select=id,week_number,title,baby_size_label,baby_size_compare_object,baby_summary,mother_summary,warning_signs,recommended_actions,status,updated_at&status=eq.published&order=week_number.asc",
    );
  });

  it("returns week detail rows and falls back to content schema reads", async () => {
    mockedSelect
      .mockResolvedValueOnce([
        {
          id: "week-2",
          week_number: 2,
          title: "2주차",
          baby_size_label: null,
          baby_size_compare_object: null,
          baby_summary: null,
          mother_summary: null,
          warning_signs: null,
          recommended_actions: null,
          status: "draft",
          updated_at: "2026-03-20T10:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "section-1",
          day_number: 1,
          code: "check",
          title: "체크",
          description: "설명",
          display_order: 1,
          is_required: true,
          is_active: true,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "asset-1",
          day_number: 1,
          code: "hero",
          question_type: "hero",
          question_text: "/hero.jpg",
          help_text: "hero",
          display_order: 1,
          is_required: false,
          is_active: true,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "day-1",
          day_number: 1,
          title: "Day 1",
          baby_development_payload: { items: ["a"] },
          baby_message: null,
          mother_changes_payload: { items: ["b"] },
          display_order: 1,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "media-1",
          day_number: null,
          media_scope: "week",
          bucket_id: "pregnancy-content",
          object_path: "weeks/2/hero.jpg",
          media_role: "hero",
          alt_text: null,
          source_file_name: null,
          display_order: 1,
        },
      ]);

    const week = await repository.getWeek(2);
    const children = await repository.getWeekChildren("week-2");

    expect(week?.id).toBe("week-2");
    expect(children.sections).toHaveLength(1);
    expect(children.assets).toHaveLength(1);
    expect(children.days).toHaveLength(1);
    expect(children.media).toHaveLength(1);
    expect(mockedSelect).toHaveBeenCalledWith(
      "content_pregnancy_week_data?select=id,week_number,title,baby_size_label,baby_size_compare_object,baby_summary,mother_summary,warning_signs,recommended_actions,status,updated_at&week_number=eq.2&status=eq.published&limit=1",
    );
    expect(mockedSelect).toHaveBeenCalledWith(
      "content.week_checklists?select=id,day_number,code,title,description,display_order,is_required,is_active&week_data_id=eq.week-2&order=day_number.asc.nullslast,display_order.asc.nullslast",
    );
  });

  it("updates week summary and upserts/deletes child rows", async () => {
    mockedUpdate.mockResolvedValue([]);
    mockedInsert.mockResolvedValue([{ id: "new-day-id" }]);
    const dayIdByNumber = new Map<number, string>([[1, "existing-day-id"]]);
    const days: AdminWeekDayInput[] = [
      {
        id: "existing-day-id",
        dayNumber: 1,
        title: "Day 1",
        babyDevelopmentItems: ["아기"],
        babyMessage: "메시지",
        motherChangesItems: ["엄마"],
        displayOrder: 1,
      },
      {
        dayNumber: 2,
        title: "Day 2",
        babyDevelopmentItems: ["신규"],
        babyMessage: null,
        motherChangesItems: ["신규"],
        displayOrder: 2,
      },
    ];
    const sections: AdminWeekSectionInput[] = [
      {
        id: "section-existing",
        dayNumber: 1,
        sectionKey: "baby_growth",
        title: "아기 성장",
        body: "본문",
        displayOrder: 1,
        isRequired: true,
        isActive: true,
      },
      {
        dayNumber: 2,
        sectionKey: "checklist",
        title: "체크",
        body: "새 본문",
        displayOrder: 2,
        isRequired: false,
        isActive: true,
      },
    ];
    const assets: AdminWeekAssetInput[] = [
      {
        id: "asset-existing",
        dayNumber: 1,
        assetType: "hero",
        storagePath: "/hero.jpg",
        altText: "hero",
        styleKey: "hero-card",
        displayOrder: 1,
        isRequired: false,
        isActive: true,
      },
      {
        dayNumber: 2,
        assetType: "compare",
        storagePath: "/compare.jpg",
        altText: "compare",
        styleKey: "compare-card",
        displayOrder: 2,
        isRequired: false,
        isActive: true,
      },
    ];
    const media: AdminWeekMediaInput[] = [
      {
        id: "media-existing",
        dayNumber: null,
        mediaScope: "week",
        bucketId: "pregnancy-content",
        objectPath: "weeks/2/hero.jpg",
        mediaRole: "hero",
        altText: null,
        sourceFileName: "hero.jpg",
        displayOrder: 1,
      },
      {
        dayNumber: 2,
        mediaScope: "day",
        bucketId: "pregnancy-content",
        objectPath: "weeks/2/day-02/ref.jpg",
        mediaRole: "reference",
        altText: "ref",
        sourceFileName: "ref.jpg",
        displayOrder: 2,
      },
    ];

    await repository.updateWeekSummary("week-2", {
      title: "수정",
      babySizeLabel: "체리",
      babySizeCompareObject: "작은 체리",
      babySummary: "아기",
      motherSummary: "엄마",
      heroImagePath: "/hero-next.jpg",
      compareImagePath: "/compare-next.jpg",
      status: "published",
    });
    const mappedDayIds = await repository.upsertDayContents("week-2", days);
    mappedDayIds.set(1, dayIdByNumber.get(1) ?? "existing-day-id");
    await repository.upsertChecklists("week-2", sections, mappedDayIds);
    await repository.upsertQuestions("week-2", assets, mappedDayIds);
    await repository.upsertMedia("week-2", media, mappedDayIds);
    await repository.deleteChecklist("section-delete");
    await repository.deleteQuestion("asset-delete");
    await repository.deleteDay("day-delete");
    await repository.deleteMedia("media-delete");

    expect(mockedUpdate).toHaveBeenCalledWith(
      "content.pregnancy_week_data?id=eq.week-2",
      expect.objectContaining({
        title: "수정",
        warning_signs: "/hero-next.jpg",
        recommended_actions: "/compare-next.jpg",
      }),
    );
    expect(mockedInsert).toHaveBeenCalledWith(
      "content.pregnancy_day_contents",
      expect.objectContaining({
        id: "11111111-1111-4111-8111-111111111111",
        week_data_id: "week-2",
        day_number: 2,
      }),
    );
    expect(mockedInsert).toHaveBeenCalledWith(
      "content.week_checklists",
      expect.objectContaining({
        id: "22222222-2222-4222-8222-222222222222",
        week_data_id: "week-2",
        day_number: 2,
      }),
    );
    expect(mockedInsert).toHaveBeenCalledWith(
      "content.week_questions",
      expect.objectContaining({
        id: "33333333-3333-4333-8333-333333333333",
        week_data_id: "week-2",
        day_number: 2,
      }),
    );
    expect(mockedInsert).toHaveBeenCalledWith(
      "content.pregnancy_week_media",
      expect.objectContaining({
        id: "44444444-4444-4444-8444-444444444444",
        week_data_id: "week-2",
        day_number: 2,
      }),
    );
    expect(mockedDelete).toHaveBeenCalledWith(
      "content.week_checklists?id=eq.section-delete",
    );
    expect(mockedDelete).toHaveBeenCalledWith(
      "content.week_questions?id=eq.asset-delete",
    );
    expect(mockedDelete).toHaveBeenCalledWith(
      "content.pregnancy_day_contents?id=eq.day-delete",
    );
    expect(mockedDelete).toHaveBeenCalledWith(
      "content.pregnancy_week_media?id=eq.media-delete",
    );
  });

  it("exposes canonical week child row typings", () => {
    const day: SupabaseWeekDayRow = {
      id: "day-id",
      day_number: 1,
      title: "Day 1",
      baby_development_payload: { items: ["a"] },
      baby_message: null,
      mother_changes_payload: { items: ["b"] },
      display_order: 1,
    };
    const section: SupabaseWeekSectionRow = {
      id: "section-id",
      day_number: 1,
      code: "baby_growth",
      title: "아기 성장",
      description: "desc",
      display_order: 1,
      is_required: true,
      is_active: true,
    };
    const asset: SupabaseWeekAssetRow = {
      id: "asset-id",
      day_number: 1,
      code: "hero-card",
      question_type: "hero",
      question_text: "/hero.jpg",
      help_text: null,
      display_order: 1,
      is_required: false,
      is_active: true,
    };
    const media: SupabaseWeekMediaRow = {
      id: "media-id",
      day_number: null,
      media_scope: "week",
      bucket_id: "pregnancy-content",
      object_path: "weeks/1/hero.jpg",
      media_role: "hero",
      alt_text: null,
      source_file_name: null,
      display_order: 1,
    };

    expect(day.day_number).toBe(1);
    expect(section.code).toBe("baby_growth");
    expect(asset.question_type).toBe("hero");
    expect(media.media_scope).toBe("week");
  });
});
