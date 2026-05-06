import { GoogleGenAI } from "@google/genai";

export type GoogleTextGenerationInput = {
  apiKey: string;
  model: string;
  prompt: string;
  maxOutputTokens?: number;
};

export async function generateGoogleText(input: GoogleTextGenerationInput) {
  const client = new GoogleGenAI({ apiKey: input.apiKey });
  const config =
    typeof input.maxOutputTokens === "number" &&
    Number.isFinite(input.maxOutputTokens)
      ? { maxOutputTokens: input.maxOutputTokens }
      : undefined;

  const response = await client.models.generateContent({
    model: input.model,
    contents: input.prompt,
    ...(config ? { config } : {}),
  });

  return (response.text ?? "").trim();
}
