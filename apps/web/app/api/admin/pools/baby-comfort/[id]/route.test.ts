jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@gynecology-chatbot/db/prisma", () => {
  return {
    prisma: {
      content_baby_comfort_pool: {
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      admin_audit_logs: {
        create: jest.fn(),
      },
    },
  };
});

import { readAdminSessionUser } from "@/lib/admin/auth";
import { prisma } from "@gynecology-chatbot/db/prisma";

import { PATCH, DELETE } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;
const mockedPrisma = prisma as unknown as {
  content_baby_comfort_pool: {
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  admin_audit_logs: { create: jest.Mock };
};

function makeRequest(body: unknown, method: string = "PATCH") {
  return new Request("http://localhost/api/admin/pools/baby-comfort/row-1", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof PATCH>[0];
}

function makeContext(id: string | null) {
  return { params: Promise.resolve({ id: id ?? "" }) };
}

describe("/api/admin/pools/baby-comfort/[id] PATCH", () => {
  const currentRow = {
    id: "row-1",
    text: "old text",
    tag_week: 10,
    tag_mood: "calm",
    weight: 1,
    active: true,
    previous_snapshot: null,
    updated_at: new Date("2026-04-20T00:00:00Z"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedReadAdminSessionUser.mockResolvedValue({ id: "admin-1" } as never);
    mockedPrisma.content_baby_comfort_pool.findUnique.mockResolvedValue(
      currentRow,
    );
    mockedPrisma.content_baby_comfort_pool.update.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({
          ...currentRow,
          ...data,
          updated_at: new Date("2026-04-24T00:00:00Z"),
        }),
    );
    mockedPrisma.admin_audit_logs.create.mockResolvedValue({});
  });

  it("returns 401 when no admin session", async () => {
    mockedReadAdminSessionUser.mockResolvedValueOnce(null);
    const response = await PATCH(
      makeRequest({ text: "new" }),
      makeContext("row-1"),
    );
    expect(response.status).toBe(401);
  });

  it("stores previous row into previous_snapshot when saving", async () => {
    const response = await PATCH(
      makeRequest({ text: "new text", active: false }),
      makeContext("row-1"),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      item: { text: string; active: boolean };
    };
    expect(body.item.text).toBe("new text");
    expect(body.item.active).toBe(false);

    // saveSnapshotAndUpdate queries the current row, then calls update with
    // previous_snapshot containing the prior values.
    expect(
      mockedPrisma.content_baby_comfort_pool.findUnique,
    ).toHaveBeenCalledWith({ where: { id: "row-1" } });
    const updateArgs =
      mockedPrisma.content_baby_comfort_pool.update.mock.calls[0][0];
    expect(updateArgs.where).toEqual({ id: "row-1" });
    expect(updateArgs.data.text).toBe("new text");
    expect(updateArgs.data.active).toBe(false);
    expect(updateArgs.data.updated_by).toBe("admin-1");
    expect(updateArgs.data.previous_snapshot).toMatchObject({
      id: "row-1",
      text: "old text",
      tag_week: 10,
      tag_mood: "calm",
    });
    expect(
      (updateArgs.data.previous_snapshot as Record<string, unknown>)
        .previous_snapshot,
    ).toBeUndefined();

    expect(mockedPrisma.admin_audit_logs.create).toHaveBeenCalledTimes(1);
    const auditArgs =
      mockedPrisma.admin_audit_logs.create.mock.calls[0][0].data;
    expect(auditArgs.action_type).toBe("update");
    expect(auditArgs.entity_type).toBe("baby-comfort-pool");
    expect(auditArgs.entity_id).toBe("row-1");
  });

  it("rejects empty text", async () => {
    const response = await PATCH(
      makeRequest({ text: "   " }),
      makeContext("row-1"),
    );
    expect(response.status).toBe(400);
    expect(
      mockedPrisma.content_baby_comfort_pool.update,
    ).not.toHaveBeenCalled();
  });

  it("rejects invalid tag_mood", async () => {
    const response = await PATCH(
      makeRequest({ tag_mood: "bogus" }),
      makeContext("row-1"),
    );
    expect(response.status).toBe(400);
  });

  it("rejects tag_week outside 1-40", async () => {
    const response = await PATCH(
      makeRequest({ tag_week: 99 }),
      makeContext("row-1"),
    );
    expect(response.status).toBe(400);
  });

  it("returns 404 when row not found", async () => {
    mockedPrisma.content_baby_comfort_pool.findUnique.mockResolvedValueOnce(
      null,
    );
    const response = await PATCH(
      makeRequest({ text: "new" }),
      makeContext("row-1"),
    );
    expect(response.status).toBe(404);
  });
});

describe("/api/admin/pools/baby-comfort/[id] DELETE", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedReadAdminSessionUser.mockResolvedValue({ id: "admin-1" } as never);
    mockedPrisma.content_baby_comfort_pool.findUnique.mockResolvedValue({
      id: "row-1",
      text: "gone",
      tag_week: null,
      tag_mood: null,
      weight: 1,
      active: true,
      previous_snapshot: null,
      updated_at: new Date("2026-04-20T00:00:00Z"),
    });
    mockedPrisma.content_baby_comfort_pool.delete.mockResolvedValue({});
    mockedPrisma.admin_audit_logs.create.mockResolvedValue({});
  });

  it("deletes row and writes audit log", async () => {
    const response = await DELETE(
      makeRequest({}, "DELETE"),
      makeContext("row-1"),
    );
    expect(response.status).toBe(200);
    expect(mockedPrisma.content_baby_comfort_pool.delete).toHaveBeenCalledWith({
      where: { id: "row-1" },
    });
    expect(mockedPrisma.admin_audit_logs.create).toHaveBeenCalledTimes(1);
  });

  it("returns 401 without session", async () => {
    mockedReadAdminSessionUser.mockResolvedValueOnce(null);
    const response = await DELETE(
      makeRequest({}, "DELETE"),
      makeContext("row-1"),
    );
    expect(response.status).toBe(401);
  });

  it("returns 404 when row missing", async () => {
    mockedPrisma.content_baby_comfort_pool.findUnique.mockResolvedValueOnce(
      null,
    );
    const response = await DELETE(
      makeRequest({}, "DELETE"),
      makeContext("row-1"),
    );
    expect(response.status).toBe(404);
  });
});
