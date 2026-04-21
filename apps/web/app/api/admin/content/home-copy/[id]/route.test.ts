jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/admin/home-copy-config", () => ({
  deleteHomeCopyItem: jest.fn(),
  parseHomeCopyPayload: jest.fn(),
  updateHomeCopyItem: jest.fn(),
}));

import type { HomeCopyItemInput } from "@gynecology-chatbot/app-core";
import { readAdminSessionUser } from "@/lib/admin/auth";
import {
  deleteHomeCopyItem,
  parseHomeCopyPayload,
  updateHomeCopyItem,
} from "@/lib/admin/home-copy-config";
import { DELETE, PATCH } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;
const mockedUpdateHomeCopyItem = updateHomeCopyItem as jest.MockedFunction<
  typeof updateHomeCopyItem
>;
const mockedDeleteHomeCopyItem = deleteHomeCopyItem as jest.MockedFunction<
  typeof deleteHomeCopyItem
>;
const mockedParseHomeCopyPayload = parseHomeCopyPayload as jest.MockedFunction<
  typeof parseHomeCopyPayload
>;

describe("/api/admin/content/home-copy/[id]", () => {
  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedUpdateHomeCopyItem.mockReset();
    mockedDeleteHomeCopyItem.mockReset();
    mockedParseHomeCopyPayload.mockReset();
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    } as never);
  });

  test("updates an existing home copy item", async () => {
    const input: HomeCopyItemInput = {
      slot: "daily_note",
      variant: "default",
      title: "오늘의 한마디",
      body: "오늘도 천천히 살펴봐요.",
      status: "published",
      displayOrder: 3,
    };
    const item = {
      id: "copy-1",
      ...input,
      variant: input.variant ?? null,
      displayOrder: input.displayOrder ?? 3,
      updatedAt: "2026-04-21T00:00:00.000Z",
    };
    mockedParseHomeCopyPayload.mockReturnValue(input);
    mockedUpdateHomeCopyItem.mockResolvedValue({ item, items: [item] });

    const response = await PATCH(
      new Request("http://localhost/api/admin/content/home-copy/copy-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
      { params: Promise.resolve({ id: "copy-1" }) },
    );

    expect(response.status).toBe(200);
    expect(mockedUpdateHomeCopyItem).toHaveBeenCalledWith("copy-1", input);
    await expect(response.json()).resolves.toEqual({
      homeCopyItem: expect.objectContaining({ id: "copy-1" }),
      homeCopyItems: [expect.objectContaining({ id: "copy-1" })],
    });
  });

  test("returns not found when deleting a missing item", async () => {
    mockedDeleteHomeCopyItem.mockResolvedValue(null);

    const response = await DELETE(
      new Request("http://localhost/api/admin/content/home-copy/missing", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "missing" }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "home copy item not found",
    });
  });
});
