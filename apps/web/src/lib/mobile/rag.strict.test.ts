jest.mock("./schift-client", () => ({
  getSchiftClient: () => null,
}));

jest.mock("@/lib/supabase/admin-client", () => ({
  supabaseSelect: jest.fn(async () => [
    { key: "rag_provider", value: { ragProvider: "supabase" } },
  ]),
  supabaseRpc: jest.fn(),
}));

import { retrievePregnancyContext } from "./rag";

describe("retrievePregnancyContext strict configuration", () => {
  const originalGemini = process.env.GEMINI_API_KEY;
  const originalGoogle = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  afterEach(() => {
    if (originalGemini === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalGemini;
    }

    if (originalGoogle === undefined) {
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    } else {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalGoogle;
    }
  });

  it("throws when embedding API key is missing", async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    await expect(
      retrievePregnancyContext({
        query: "입덧이 심해요",
        currentWeek: 10,
      }),
    ).rejects.toThrow("Embedding configuration is missing");
  });
});
