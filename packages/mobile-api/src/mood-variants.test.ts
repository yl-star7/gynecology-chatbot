jest.mock("@gynecology-chatbot/db/prisma", () => ({
  prisma: {
    content_mood_variants: {
      findFirst: jest.fn(),
    },
  },
}));

import { prisma } from "@gynecology-chatbot/db/prisma";
import {
  createMoodVariantSeed,
  classifyMoodToneWithLlm,
  inferMoodToneFromFreeText,
  parseMoodClassification,
  parseMoodVariantTextPool,
  resolveMoodVariantSuffix,
  resolveMoodVariantTextPool,
} from "./mood-variants";

const mockedFindFirst = (
  prisma as unknown as {
    content_mood_variants: { findFirst: jest.Mock };
  }
).content_mood_variants.findFirst;

describe("resolveMoodVariantSuffix", () => {
  beforeEach(() => {
    mockedFindFirst.mockReset();
  });

  it("returns the prompt_suffix when an active variant exists", async () => {
    mockedFindFirst.mockResolvedValue({
      prompt_suffix: "오늘은 억지로 힘내지 않아도 돼요.",
    });
    const suffix = await resolveMoodVariantSuffix({
      scenario: "baby_info_offer",
      mood: "tired",
    });
    expect(suffix).toBe("오늘은 억지로 힘내지 않아도 돼요.");
    expect(mockedFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          scenario: "baby_info_offer",
          mood: "tired",
          active: true,
        },
      }),
    );
  });

  it("returns a seeded item from a newline-delimited response pool", async () => {
    mockedFindFirst.mockResolvedValue({
      prompt_suffix: "첫 번째 문장\n두 번째 문장\n세 번째 문장",
    });
    const pool = await resolveMoodVariantTextPool({
      scenario: "mood_intake",
      mood: "joyful",
      rngSeed: 1,
    });
    expect(pool).toEqual(["두 번째 문장"]);
  });

  it("parses JSON arrays and bullet lines as response pools", () => {
    expect(parseMoodVariantTextPool('["좋아요", "반가워요", " "]')).toEqual([
      "좋아요",
      "반가워요",
    ]);
    expect(parseMoodVariantTextPool("- 좋아요\n* 반가워요")).toEqual([
      "좋아요",
      "반가워요",
    ]);
  });

  it("infers a sad tone from short free-text disappointment", () => {
    expect(
      inferMoodToneFromFreeText("운동하려했는데 비가와서 속상해요"),
    ).toBe("sad");
  });

  it("parses only supported mood classifier labels", () => {
    expect(parseMoodClassification(" sad\n")).toBe("sad");
    expect(parseMoodClassification("기분 나쁨")).toBe("unknown");
  });

  it("uses the local classifier when the LLM API key is missing", async () => {
    const previousGemini = process.env.GEMINI_API_KEY;
    const previousGoogle = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    try {
      await expect(
        classifyMoodToneWithLlm({
          text: "운동하려했는데 비가와서 속상해요",
          generate: jest.fn(),
        }),
      ).resolves.toBe("sad");
    } finally {
      if (previousGemini) process.env.GEMINI_API_KEY = previousGemini;
      if (previousGoogle)
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = previousGoogle;
    }
  });

  it("does not infer mood from medical symptom text", () => {
    expect(inferMoodToneFromFreeText("배가 아파서 불안해요")).toBeNull();
  });

  it("creates stable seeds from the same inputs", () => {
    expect(createMoodVariantSeed(["user-1", "session-1", "속상해요"])).toBe(
      createMoodVariantSeed(["user-1", "session-1", "속상해요"]),
    );
  });

  it("returns null when no row matches", async () => {
    mockedFindFirst.mockResolvedValue(null);
    const suffix = await resolveMoodVariantTextPool({
      scenario: "letter_reflection",
      mood: "calm",
    });
    expect(suffix).toEqual([]);
  });

  it("returns null when scenario is missing", async () => {
    const suffix = await resolveMoodVariantSuffix({
      scenario: null,
      mood: "calm",
    });
    expect(suffix).toBeNull();
    expect(mockedFindFirst).not.toHaveBeenCalled();
  });

  it("returns null when mood is not in the allowed enum", async () => {
    const suffix = await resolveMoodVariantSuffix({
      scenario: "baby_info_offer",
      mood: "euphoric",
    });
    expect(suffix).toBeNull();
    expect(mockedFindFirst).not.toHaveBeenCalled();
  });

  it("swallows DB errors and returns null", async () => {
    mockedFindFirst.mockRejectedValue(new Error("db down"));
    const suffix = await resolveMoodVariantSuffix({
      scenario: "empathy_chat",
      mood: "sad",
    });
    expect(suffix).toBeNull();
  });

  it("trims whitespace from prompt_suffix and returns null on blank", async () => {
    mockedFindFirst.mockResolvedValue({ prompt_suffix: "   \n  " });
    const suffix = await resolveMoodVariantSuffix({
      scenario: "baby_info_offer",
      mood: "anxious",
    });
    expect(suffix).toBeNull();
  });
});
