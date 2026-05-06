jest.mock("@gynecology-chatbot/db/prisma", () => ({
  prisma: {
    admin_audit_logs: {
      create: jest.fn(),
    },
  },
}));

import { prisma } from "@gynecology-chatbot/db/prisma";

import { recordViewChatMessagesAudit } from "./write-view-audit";

const mockedCreate = (
  prisma as unknown as {
    admin_audit_logs: { create: jest.Mock };
  }
).admin_audit_logs.create;

describe("recordViewChatMessagesAudit", () => {
  beforeEach(() => {
    mockedCreate.mockReset();
  });

  test("writes an admin_audit_logs row with action_type=view_chat_messages", async () => {
    mockedCreate.mockResolvedValueOnce({ id: "audit-1" });

    await recordViewChatMessagesAudit({
      actorUserId: "11111111-1111-1111-1111-111111111111",
      targetUserId: "22222222-2222-2222-2222-222222222222",
      sessionId: "33333333-3333-3333-3333-333333333333",
    });

    expect(mockedCreate).toHaveBeenCalledTimes(1);
    const callArg = mockedCreate.mock.calls[0][0];
    expect(callArg.data.action_type).toBe("view_chat_messages");
    expect(callArg.data.entity_type).toBe("chat_session");
    expect(callArg.data.entity_id).toBe("33333333-3333-3333-3333-333333333333");
    expect(callArg.data.admin_user_id).toBe(
      "11111111-1111-1111-1111-111111111111",
    );
    expect(callArg.data.target_user_id).toBe(
      "22222222-2222-2222-2222-222222222222",
    );
  });

  test("swallows prisma errors so admin page still renders", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockedCreate.mockRejectedValueOnce(new Error("db down"));

    await expect(
      recordViewChatMessagesAudit({
        actorUserId: "11111111-1111-1111-1111-111111111111",
        targetUserId: "22222222-2222-2222-2222-222222222222",
        sessionId: "33333333-3333-3333-3333-333333333333",
      }),
    ).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
