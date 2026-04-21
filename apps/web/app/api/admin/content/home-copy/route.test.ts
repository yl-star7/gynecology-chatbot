jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/admin/home-copy-config", () => ({
  createHomeCopyItem: jest.fn(),
  listHomeCopyItems: jest.fn(),
  parseHomeCopyPayload: jest.fn(),
}));

import type { HomeCopyItemInput } from "@gynecology-chatbot/app-core";
import { readAdminSessionUser } from "@/lib/admin/auth";
import {
  createHomeCopyItem,
  listHomeCopyItems,
  parseHomeCopyPayload,
} from "@/lib/admin/home-copy-config";
import { GET, POST } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;
const mockedListHomeCopyItems = listHomeCopyItems as jest.MockedFunction<
  typeof listHomeCopyItems
>;
const mockedCreateHomeCopyItem = createHomeCopyItem as jest.MockedFunction<
  typeof createHomeCopyItem
>;
const mockedParseHomeCopyPayload = parseHomeCopyPayload as jest.MockedFunction<
  typeof parseHomeCopyPayload
>;

describe("/api/admin/content/home-copy", () => {
  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedListHomeCopyItems.mockReset();
    mockedCreateHomeCopyItem.mockReset();
    mockedParseHomeCopyPayload.mockReset();
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    } as never);
  });

  test("returns editable home copy items for admins", async () => {
    mockedListHomeCopyItems.mockResolvedValue([
      {
        id: "copy-1",
        slot: "daily_note",
        variant: "default",
        title: "오늘의 한마디",
        body: "천천히 살펴봐요.",
        status: "published",
        displayOrder: 1,
        updatedAt: "2026-04-21T00:00:00.000Z",
      },
    ]);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      homeCopyItems: [
        expect.objectContaining({
          id: "copy-1",
          title: "오늘의 한마디",
        }),
      ],
    });
  });

  test("creates a home copy item after validating payload", async () => {
    const input: HomeCopyItemInput = {
      slot: "hero_bubble",
      variant: "default",
      title: "아기 말풍선",
      body: "{babyName}는 잘 자라고 있어요.",
      status: "draft",
      displayOrder: 2,
    };
    mockedParseHomeCopyPayload.mockReturnValue(input);
    mockedCreateHomeCopyItem.mockResolvedValue({
      item: {
        id: "copy-2",
        ...input,
        variant: input.variant ?? null,
        displayOrder: input.displayOrder ?? 2,
        updatedAt: "2026-04-21T00:00:00.000Z",
      },
      items: [],
    });

    const response = await POST(
      new Request("http://localhost/api/admin/content/home-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(mockedCreateHomeCopyItem).toHaveBeenCalledWith(input);
    await expect(response.json()).resolves.toEqual({
      homeCopyItem: expect.objectContaining({
        id: "copy-2",
        title: "아기 말풍선",
      }),
      homeCopyItems: [],
    });
  });

  test("rejects invalid payloads", async () => {
    mockedParseHomeCopyPayload.mockReturnValue(null);

    const response = await POST(
      new Request("http://localhost/api/admin/content/home-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "" }),
      }) as never,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "invalid home copy payload",
    });
  });
});
