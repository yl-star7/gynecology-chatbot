jest.mock("@gynecology-chatbot/db/prisma", () => {
  const mockedPrisma = {
    system_config: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };
  return { prisma: mockedPrisma };
});

jest.mock("@gynecology-chatbot/app-core", () => ({
  HOME_COPY_CONFIG_KEY: "home_copy",
  getHomeCopyItemsForAdmin: jest.fn((value) =>
    Array.isArray(value) ? value : [],
  ),
  normalizeHomeCopyItemInput: jest.fn((x) => x),
}));

import { prisma } from "@gynecology-chatbot/db/prisma";
import { updateHomeCopyItem, createHomeCopyItem } from "./home-copy-config";

const mockedPrisma = prisma as unknown as {
  system_config: {
    findUnique: jest.Mock;
    upsert: jest.Mock;
  };
};

const existingItem = {
  id: "item-1",
  slot: "hero_bubble" as const,
  variant: null,
  title: "기존 제목",
  body: "기존 본문",
  status: "published" as const,
  displayOrder: 1,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("home-copy-config — snapshot wiring", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // listHomeCopyItems reads system_config
    mockedPrisma.system_config.findUnique
      // first call: readHomeCopyConfigValue (for listHomeCopyItems)
      .mockResolvedValueOnce({ value: [existingItem] })
      // second call: readSystemConfigSnapshot
      .mockResolvedValueOnce({
        key: "home_copy",
        value: [existingItem],
        updated_at: new Date("2026-01-01"),
        updated_by: null,
        previous_snapshot: null,
      });
    mockedPrisma.system_config.upsert.mockResolvedValue({});
  });

  it("updateHomeCopyItem passes previous_snapshot and actorId to upsert", async () => {
    await updateHomeCopyItem(
      "item-1",
      {
        slot: "hero_bubble" as const,
        variant: null,
        title: "새 제목",
        body: "새 본문",
        status: "published",
        displayOrder: 1,
      },
      "actor-uuid-99",
    );

    expect(mockedPrisma.system_config.upsert).toHaveBeenCalledTimes(1);
    const upsertCall = mockedPrisma.system_config.upsert.mock.calls[0][0];
    expect(upsertCall.update.updated_by).toBe("actor-uuid-99");
    expect(upsertCall.update.previous_snapshot).toBeDefined();
    // snapshot should contain the existing row data (without previous_snapshot field itself)
    expect(upsertCall.update.previous_snapshot).toMatchObject({
      key: "home_copy",
      updated_at: "2026-01-01T00:00:00.000Z",
    });
    expect(
      upsertCall.update.previous_snapshot.previous_snapshot,
    ).toBeUndefined();
  });

  it("createHomeCopyItem passes actorId to upsert", async () => {
    await createHomeCopyItem(
      {
        slot: "daily_note" as const,
        variant: null,
        title: "신규",
        body: "내용",
        status: "draft",
        displayOrder: 2,
      },
      "actor-uuid-88",
    );

    expect(mockedPrisma.system_config.upsert).toHaveBeenCalledTimes(1);
    const upsertCall = mockedPrisma.system_config.upsert.mock.calls[0][0];
    expect(upsertCall.update.updated_by).toBe("actor-uuid-88");
  });
});
