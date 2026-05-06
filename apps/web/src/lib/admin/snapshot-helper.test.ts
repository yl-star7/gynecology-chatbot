jest.mock("@gynecology-chatbot/db/prisma", () => {
  const fakeTxn = async <T>(fn: (tx: unknown) => Promise<T>) => fn({});
  return {
    prisma: {
      $transaction: jest.fn(fakeTxn),
      content_knowledge_items: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    },
  };
});

import { prisma } from "@gynecology-chatbot/db/prisma";
import {
  rollbackFromSnapshot,
  saveSnapshotAndUpdate,
  resolveSnapshotModel,
} from "./snapshot-helper";

const mockedPrisma = prisma as unknown as {
  $transaction: jest.Mock;
  content_knowledge_items: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};

function makeFakeModel() {
  return {
    findUnique: jest.fn(),
    update: jest.fn(),
  };
}

describe("snapshot-helper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("saveSnapshotAndUpdate", () => {
    it("snapshots current row before update", async () => {
      const model = makeFakeModel();
      const current = {
        id: "row-1",
        slug: "old-slug",
        body: "old body",
        previous_snapshot: null,
        created_at: new Date("2026-04-24T00:00:00.000Z"),
        updated_at: new Date("2026-04-24T00:01:00.000Z"),
        updated_by: null,
      };
      model.findUnique.mockResolvedValue(current);
      model.update.mockResolvedValue({
        ...current,
        body: "new body",
      });

      await saveSnapshotAndUpdate({
        model: model as never,
        id: "row-1",
        data: { body: "new body" },
        actorId: "admin-1",
      });

      expect(model.findUnique).toHaveBeenCalledWith({ where: { id: "row-1" } });
      const updateArgs = model.update.mock.calls[0][0];
      expect(updateArgs.where).toEqual({ id: "row-1" });
      expect(updateArgs.data.body).toBe("new body");
      expect(updateArgs.data.updated_by).toBe("admin-1");
      expect(updateArgs.data.previous_snapshot).toMatchObject({
        id: "row-1",
        slug: "old-slug",
        body: "old body",
        created_at: "2026-04-24T00:00:00.000Z",
        updated_at: "2026-04-24T00:01:00.000Z",
      });
      // previous_snapshot 자체는 스냅샷 안에 포함되지 않는다
      expect(
        (updateArgs.data.previous_snapshot as Record<string, unknown>)
          .previous_snapshot,
      ).toBeUndefined();
    });

    it("sets previous_snapshot null when row not found", async () => {
      const model = makeFakeModel();
      model.findUnique.mockResolvedValue(null);
      model.update.mockResolvedValue({ id: "row-1" });

      await saveSnapshotAndUpdate({
        model: model as never,
        id: "row-1",
        data: { body: "x" },
      });

      const updateArgs = model.update.mock.calls[0][0];
      expect(updateArgs.data.previous_snapshot).toBeNull();
    });
  });

  describe("rollbackFromSnapshot", () => {
    it("restores fields from previous_snapshot and clears it", async () => {
      const model = makeFakeModel();
      model.findUnique.mockResolvedValue({
        id: "row-1",
        body: "new body",
        previous_snapshot: {
          id: "row-1",
          body: "old body",
          slug: "old-slug",
          created_at: "2026-01-01T00:00:00Z",
        },
      });
      model.update.mockResolvedValue({ id: "row-1", body: "old body" });

      const restored = await rollbackFromSnapshot(
        model as never,
        "row-1",
        "admin-1",
      );

      expect(restored).not.toBeNull();
      const updateArgs = model.update.mock.calls[0][0];
      expect(updateArgs.data.body).toBe("old body");
      expect(updateArgs.data.slug).toBe("old-slug");
      expect(updateArgs.data.previous_snapshot).toBeNull();
      expect(updateArgs.data.id).toBeUndefined();
      expect(updateArgs.data.created_at).toBeUndefined();
      expect(updateArgs.data.updated_by).toBe("admin-1");
    });

    it("returns null when previous_snapshot is missing", async () => {
      const model = makeFakeModel();
      model.findUnique.mockResolvedValue({
        id: "row-1",
        previous_snapshot: null,
      });
      const restored = await rollbackFromSnapshot(model as never, "row-1");
      expect(restored).toBeNull();
      expect(model.update).not.toHaveBeenCalled();
    });

    it("returns null when row not found", async () => {
      const model = makeFakeModel();
      model.findUnique.mockResolvedValue(null);
      const restored = await rollbackFromSnapshot(model as never, "missing");
      expect(restored).toBeNull();
    });
  });

  describe("resolveSnapshotModel", () => {
    it("maps known resources to Prisma delegates", () => {
      const model = resolveSnapshotModel("knowledge-items");
      expect(model).toBe(mockedPrisma.content_knowledge_items);
    });

    it("returns null for unknown resource", () => {
      expect(resolveSnapshotModel("bogus")).toBeNull();
    });
  });
});
