import {
  supabaseInsert,
  supabaseSelect,
  supabaseUpdate,
} from "@/lib/mobile/supabase-rest";
import { SupabaseAdminContentPortAdapter } from "./supabase-admin-content-port";

jest.mock("@/lib/mobile/supabase-rest", () => ({
  supabaseSelect: jest.fn(),
  supabaseInsert: jest.fn(),
  supabaseUpdate: jest.fn(),
}));

const mockedSelect = supabaseSelect as jest.MockedFunction<
  typeof supabaseSelect
>;
const mockedInsert = supabaseInsert as jest.MockedFunction<
  typeof supabaseInsert
>;
const mockedUpdate = supabaseUpdate as jest.MockedFunction<
  typeof supabaseUpdate
>;

describe("SupabaseAdminContentPortAdapter", () => {
  const adapter = new SupabaseAdminContentPortAdapter();

  afterEach(() => {
    mockedSelect.mockReset();
    mockedInsert.mockReset();
    mockedUpdate.mockReset();
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
        hero_image_path: "/images/week1/hero.jpg",
        compare_image_path: "/images/week1/compare.png",
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
        heroImagePath: "/images/week1/hero.jpg",
        compareImagePath: "/images/week1/compare.png",
        status: "published",
        updatedAt: "2026-03-17T10:00:00.000Z",
      },
    ]);
    expect(mockedSelect).toHaveBeenCalledWith(
      expect.stringContaining("pregnancy_weeks"),
    );
  });

  it("returns detailed week content with ordered sections and assets", async () => {
    mockedSelect.mockImplementation((path: string) => {
      if (path.startsWith("pregnancy_weeks")) {
        return Promise.resolve([
          {
            id: "week-2",
            week_number: 2,
            title: "두 번째 주",
            baby_size_label: "체리",
            baby_size_compare_object: "작은 체리",
            baby_summary: "병아리처럼 작은 심장이 움직입니다.",
            mother_summary: "유방이 민감해질 수 있습니다.",
            hero_image_path: "/images/week2/hero.jpg",
            compare_image_path: "/images/week2/compare.png",
            status: "draft",
            updated_at: "2026-03-18T08:00:00.000Z",
          },
        ]);
      }

      if (path.startsWith("pregnancy_week_sections")) {
        return Promise.resolve([
          {
            id: "section-2",
            section_key: "baby_appearance",
            title: "아기 모양",
            body: "작은 체리처럼 생겼어요.",
            display_order: 2,
            is_required: true,
          },
          {
            id: "section-1",
            section_key: "attachment_question",
            title: "애착 질문",
            body: "오늘 느낀 감정을 적어주세요.",
            display_order: 1,
            is_required: false,
          },
        ]);
      }

      if (path.startsWith("pregnancy_week_assets")) {
        return Promise.resolve([
          {
            id: "asset-2",
            asset_type: "hero",
            storage_path: "/assets/week2/hero.jpg",
            alt_text: "Hero image",
            style_key: "liquid-glass",
            display_order: 2,
          },
          {
            id: "asset-1",
            asset_type: "compare",
            storage_path: "/assets/week2/compare.jpg",
            alt_text: "Compare image",
            style_key: "hero-outline",
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
      "compare",
      "hero",
    ]);
    expect(detail?.id).toBe("week-2");
  });

  it("returns null when the week is missing", async () => {
    mockedSelect.mockResolvedValueOnce([]);
    const detail = await adapter.getWeek(99);
    expect(detail).toBeNull();
  });

  it("saves week metadata, sections, and assets", async () => {
    mockedSelect.mockImplementation((path: string) => {
      if (path.startsWith("pregnancy_weeks")) {
        return Promise.resolve([
          {
            id: "week-12",
            week_number: 12,
            title: "12주차 기본",
            baby_size_label: "라임",
            baby_size_compare_object: "작은 라임",
            baby_summary: "기존 요약",
            mother_summary: "기존 엄마 요약",
            hero_image_path: "/images/week12/hero.jpg",
            compare_image_path: "/images/week12/compare.jpg",
            status: "draft",
            updated_at: "2026-03-18T08:00:00.000Z",
          },
        ]);
      }

      if (path.startsWith("pregnancy_week_sections")) {
        return Promise.resolve([
          {
            id: "section-existing",
            section_key: "baby_growth",
            title: "아기 성장",
            body: "기존 본문",
            display_order: 1,
            is_required: true,
          },
        ]);
      }

      if (path.startsWith("pregnancy_week_assets")) {
        return Promise.resolve([
          {
            id: "asset-existing",
            asset_type: "hero",
            storage_path: "/images/week12/hero.jpg",
            alt_text: "hero",
            style_key: "hero-card",
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
      sections: [
        {
          id: "section-existing",
          sectionKey: "baby_growth",
          title: "아기 성장",
          body: "수정된 본문",
          displayOrder: 1,
          isRequired: true,
        },
        {
          sectionKey: "checklist",
          title: "체크리스트",
          body: "새 섹션",
          displayOrder: 2,
          isRequired: false,
        },
      ],
      assets: [
        {
          id: "asset-existing",
          assetType: "hero",
          storagePath: "/images/week12/hero-next.jpg",
          altText: "새 hero",
          styleKey: "hero-card",
          displayOrder: 1,
        },
        {
          assetType: "compare",
          storagePath: "/images/week12/compare-next.jpg",
          altText: "새 compare",
          styleKey: "compare-card",
          displayOrder: 2,
        },
      ],
    });

    expect(mockedUpdate).toHaveBeenCalledWith(
      "pregnancy_weeks?id=eq.week-12",
      expect.objectContaining({
        title: "12주차 관리본",
        baby_size_label: "자두",
        status: "published",
      }),
    );
    expect(mockedUpdate).toHaveBeenCalledWith(
      "pregnancy_week_sections?id=eq.section-existing",
      expect.objectContaining({
        body: "수정된 본문",
      }),
    );
    expect(mockedInsert).toHaveBeenCalledWith(
      "pregnancy_week_sections",
      expect.objectContaining({
        week_id: "week-12",
        section_key: "checklist",
      }),
    );
    expect(mockedInsert).toHaveBeenCalledWith(
      "pregnancy_week_assets",
      expect.objectContaining({
        week_id: "week-12",
        asset_type: "compare",
      }),
    );
  });
});
