var mockedPrisma: any;

jest.mock("@gynecology-chatbot/db/prisma", () => {
  mockedPrisma = {
    users: {
      findMany: jest.fn(),
    },
    user_action_logs: {
      findMany: jest.fn(),
    },
  };

  return { prisma: mockedPrisma };
});

jest.mock("@/lib/mobile/solapi-sms", () => ({
  normalizePhoneNumberToE164: jest.fn((phoneNumber: string) =>
    phoneNumber === "01012345678" ? "+821012345678" : phoneNumber,
  ),
}));

jest.mock("@/lib/privacy/phone-crypto", () => ({
  computePhoneNumberBlindIndex: jest.fn(
    (phoneNumber: string) => `idx:${phoneNumber}`,
  ),
  decryptPhoneNumber: jest.fn((value: string) => value.replace(/^enc:/, "")),
}));

import { fetchChatActions } from "./load-chat-data";

const userId = "6e789ecc-d48a-4535-8ad9-1303dcddb8e5";

describe("fetchChatActions", () => {
  afterEach(() => {
    mockedPrisma.users.findMany.mockReset();
    mockedPrisma.user_action_logs.findMany.mockReset();
  });

  it("resolves a phone number filter to action log user ids and returns phone display data", async () => {
    mockedPrisma.users.findMany
      .mockResolvedValueOnce([{ id: userId }])
      .mockResolvedValueOnce([
        {
          id: userId,
          phone_number: "",
          phone_number_encrypted: "enc:+821012345678",
          phone_number_last4: "5678",
          pregnancy_profiles: { display_name: "김수연" },
        },
      ]);
    mockedPrisma.user_action_logs.findMany
      .mockResolvedValueOnce([
        {
          id: "log-1",
          user_id: userId,
          action_type: "phone_verification_started",
          payload: { flow: "sign_in" },
          occurred_at: new Date("2026-04-29T00:17:00.000Z"),
        },
      ])
      .mockResolvedValueOnce([{ action_type: "phone_verification_started" }]);

    const result = await fetchChatActions(
      {
        phoneNumber: "01012345678",
        actionType: "all",
        from: "",
        to: "",
      },
      200,
    );

    const lookupCall = mockedPrisma.users.findMany.mock.calls[0][0];
    expect(lookupCall.where.OR).toEqual(
      expect.arrayContaining([
        { phone_number_blind_index: "idx:01012345678" },
        { phone_number_blind_index: "idx:+821012345678" },
      ]),
    );

    const actionLookupCall =
      mockedPrisma.user_action_logs.findMany.mock.calls[0][0];
    expect(actionLookupCall.where).toEqual({ user_id: { in: [userId] } });
    expect(result.actions).toEqual([
      {
        id: "log-1",
        userId,
        userLabel: "김수연",
        phoneNumber: "+821012345678",
        actionType: "phone_verification_started",
        detail: '{"flow":"sign_in"}',
        occurredAt: "2026-04-29T00:17:00.000Z",
      },
    ]);
  });
});
