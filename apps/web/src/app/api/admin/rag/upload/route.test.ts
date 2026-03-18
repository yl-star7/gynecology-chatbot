jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/mobile/rag", () => ({
  embedPregnancyDocument: jest.fn(),
}));

jest.mock("@/lib/mobile/supabase-rest", () => ({
  supabaseInsert: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { embedPregnancyDocument } from "@/lib/mobile/rag";
import { supabaseInsert } from "@/lib/mobile/supabase-rest";
import { POST } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;
const mockedEmbedPregnancyDocument =
  embedPregnancyDocument as jest.MockedFunction<typeof embedPregnancyDocument>;
const mockedSupabaseInsert = supabaseInsert as jest.MockedFunction<
  typeof supabaseInsert
>;

describe("POST /api/admin/rag/upload", () => {
  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedEmbedPregnancyDocument.mockReset();
    mockedSupabaseInsert.mockReset();
  });

  test("rejects requests without an admin session", async () => {
    mockedReadAdminSessionUser.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost:3000/api/admin/rag/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "문서",
          content: "본문",
          category: "guide",
        }),
      }) as never,
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
    expect(mockedEmbedPregnancyDocument).not.toHaveBeenCalled();
    expect(mockedSupabaseInsert).not.toHaveBeenCalled();
  });
});
