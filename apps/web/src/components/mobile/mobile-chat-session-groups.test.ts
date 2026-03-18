import { groupChatSessionsByDate } from "./mobile-chat-session-groups";

describe("groupChatSessionsByDate", () => {
  it("groups sessions by day and orders the newest group first", () => {
    const groups = groupChatSessionsByDate(
      [
        {
          id: "older",
          title: "철분제 상담",
          preview: "복용 타이밍",
          updatedAtLabel: "3월 15일",
          updatedAtIso: "2026-03-15T08:00:00",
        },
        {
          id: "today-1",
          title: "복통 상담",
          preview: "아랫배 통증",
          updatedAtLabel: "오늘 14:31",
          updatedAtIso: "2026-03-17T14:31:00",
        },
        {
          id: "today-2",
          title: "출혈 상담",
          preview: "갈색 혈",
          updatedAtLabel: "오늘 09:10",
          updatedAtIso: "2026-03-17T09:10:00",
        },
      ],
      new Date("2026-03-17T15:00:00"),
    );

    expect(groups).toEqual([
      {
        dateKey: "2026-03-17",
        label: "오늘",
        sessions: [
          expect.objectContaining({ id: "today-1" }),
          expect.objectContaining({ id: "today-2" }),
        ],
      },
      {
        dateKey: "2026-03-15",
        label: expect.stringContaining("3월 15일"),
        sessions: [expect.objectContaining({ id: "older" })],
      },
    ]);
  });
});
