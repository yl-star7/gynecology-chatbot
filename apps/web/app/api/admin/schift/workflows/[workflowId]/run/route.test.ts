jest.mock("@/lib/admin/auth", () => ({
  readAdminSessionUser: jest.fn(),
}));

jest.mock("@/lib/mobile/schift-client", () => ({
  getSchiftClient: jest.fn(),
}));

import { readAdminSessionUser } from "@/lib/admin/auth";
import { getSchiftClient } from "@/lib/mobile/schift-client";
import { POST } from "./route";

const mockedReadAdminSessionUser = readAdminSessionUser as jest.MockedFunction<
  typeof readAdminSessionUser
>;
const mockedGetSchiftClient = getSchiftClient as jest.MockedFunction<
  typeof getSchiftClient
>;

describe("POST /api/admin/schift/workflows/[workflowId]/run", () => {
  beforeEach(() => {
    mockedReadAdminSessionUser.mockReset();
    mockedGetSchiftClient.mockReset();
  });

  test("rejects requests without an admin session", async () => {
    mockedReadAdminSessionUser.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost:3000/api/admin/schift/workflows/wf-1/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "복통이 있어요" }),
      }) as never,
      {
        params: Promise.resolve({ workflowId: "wf-1" }),
      },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
  });

  test("runs a Schift workflow for authenticated admins", async () => {
    mockedReadAdminSessionUser.mockResolvedValue({
      id: "admin-1",
      displayName: "운영자",
      phoneNumber: "010",
      role: "admin",
    });
    const run = jest.fn().mockResolvedValue({
      id: "run-1",
      workflow_id: "wf-1",
      status: "completed",
      outputs: {
        answer: "응급 진료가 필요할 수 있어요.",
      },
      block_states: [],
      started_at: "2026-03-23T12:00:00.000Z",
      finished_at: "2026-03-23T12:00:03.000Z",
    });
    mockedGetSchiftClient.mockReturnValue({
      workflows: { run },
    } as never);

    const response = await POST(
      new Request("http://localhost:3000/api/admin/schift/workflows/wf-1/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "복통이 있어요", inputs: { week: 18 } }),
      }) as never,
      {
        params: Promise.resolve({ workflowId: "wf-1" }),
      },
    );

    expect(run).toHaveBeenCalledWith("wf-1", {
      query: "복통이 있어요",
      week: 18,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      run: expect.objectContaining({
        id: "run-1",
        workflow_id: "wf-1",
        status: "completed",
      }),
    });
  });
});
