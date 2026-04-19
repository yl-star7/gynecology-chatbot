jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/supabase/admin-client", () => ({
  supabaseSelect: jest.fn(),
  supabaseUpdate: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import {
  supabaseSelect,
  supabaseUpdate,
} from "@/lib/supabase/admin-client";
import { GET, PATCH } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;
const mockedSupabaseSelect = supabaseSelect as jest.MockedFunction<
  typeof supabaseSelect
>;
const mockedSupabaseUpdate = supabaseUpdate as jest.MockedFunction<
  typeof supabaseUpdate
>;

describe("admin content paraphrases route", () => {
  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedSupabaseSelect.mockReset();
    mockedSupabaseUpdate.mockReset();
  });

  test("rejects requests without an admin session", async () => {
    mockedReadAdminSessionUser.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/admin/content/paraphrases?weekNumber=19"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
  });

  test("returns paraphrases for a selected week", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    });
    mockedSupabaseSelect.mockResolvedValue([
      {
        id: "item-1",
        source_week_number: 19,
        content_scope: "section",
        category: "baby_development",
        title: "아기 성장 이야기",
        summary: "요약",
        body: "본문",
        items: [],
        status: "needs_review",
        is_active: false,
        source_table: "public.content_pregnancy_week_data",
        source_id: "week-19",
        source_day_number: null,
        source_code: "w19-baby_development",
        updated_at: "2026-04-17T00:00:00.000Z",
      },
    ] as never);

    const response = await GET(
      new Request("http://localhost/api/admin/content/paraphrases?weekNumber=19"),
    );

    expect(mockedSupabaseSelect).toHaveBeenCalledWith(
      expect.stringContaining("source_week_number=eq.19"),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      paraphrases: [
        expect.objectContaining({
          id: "item-1",
          weekNumber: 19,
          category: "baby_development",
          title: "아기 성장 이야기",
          status: "needs_review",
          isActive: false,
        }),
      ],
    });
  });

  test("activates one paraphrase item and deactivates the matching active source", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    });
    mockedSupabaseSelect.mockResolvedValueOnce([
      {
        id: "item-1",
        source_table: "public.content_pregnancy_week_data",
        source_week_number: 19,
        source_day_number: null,
        source_code: "w19-baby_development",
        content_scope: "section",
        category: "baby_development",
      },
    ] as never);
    mockedSupabaseUpdate
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([
        {
          id: "item-1",
          source_week_number: 19,
          content_scope: "section",
          category: "baby_development",
          title: "아기 성장 이야기",
          summary: "요약",
          body: "본문",
          items: [],
          status: "ready",
          is_active: true,
          source_table: "public.content_pregnancy_week_data",
          source_id: "week-19",
          source_day_number: null,
          source_code: "w19-baby_development",
          updated_at: "2026-04-17T00:00:00.000Z",
        },
      ] as never);

    const response = await PATCH(
      new Request("http://localhost/api/admin/content/paraphrases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: "item-1", action: "activate" }),
      }),
    );

    expect(mockedSupabaseUpdate).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("content_paraphrased_items?"),
      { is_active: false },
    );
    expect(mockedSupabaseUpdate).toHaveBeenNthCalledWith(
      2,
      "content_paraphrased_items?id=eq.item-1",
      expect.objectContaining({
        status: "ready",
        is_active: true,
        reviewed_by: "admin-1",
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      paraphrase: expect.objectContaining({
        id: "item-1",
        status: "ready",
        isActive: true,
      }),
    });
  });
});
