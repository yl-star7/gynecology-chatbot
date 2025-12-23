/**
 * Google Imagen API Integration
 * Generates images based on text prompts
 */

const IMAGEN_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict";

interface ImagenResponse {
    predictions: Array<{
        bytesBase64Encoded: string;
        mimeType: string;
    }>;
}

/**
 * Generate image using Google Imagen
 * @param prompt - Text description of the image to generate
 * @param aspectRatio - Image aspect ratio (1:1, 16:9, 9:16, 4:3, 3:4)
 * @returns Base64 encoded image data
 */
export async function generateImage(
    prompt: string,
    aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" = "1:1"
): Promise<{ base64: string; mimeType: string }> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured");
    }

    // Safety check - only allow appropriate content for maternal health
    const safePrompt = sanitizePrompt(prompt);

    const response = await fetch(`${IMAGEN_API_ENDPOINT}?key=${apiKey}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            instances: [{ prompt: safePrompt }],
            parameters: {
                sampleCount: 1,
                aspectRatio,
                safetyFilterLevel: "block_most",
                personGeneration: "dont_allow",
            },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Imagen API error: ${error}`);
    }

    const data: ImagenResponse = await response.json();

    if (!data.predictions || data.predictions.length === 0) {
        throw new Error("No image generated");
    }

    return {
        base64: data.predictions[0].bytesBase64Encoded,
        mimeType: data.predictions[0].mimeType || "image/png",
    };
}

/**
 * Sanitize prompt for maternal health context
 */
function sanitizePrompt(prompt: string): string {
    // Add maternal health context to the prompt
    const maternalContext = "임신부 친화적이고 안전한 이미지, 부드럽고 따뜻한 색감,";

    // Remove any potentially harmful keywords
    const sanitized = prompt
        .replace(/위험|공포|호러|무서운|폭력/gi, "")
        .trim();

    return `${maternalContext} ${sanitized}`;
}

/**
 * Check if a message requests image generation
 */
export function isImageRequest(message: string): boolean {
    const imageKeywords = [
        "그림 그려",
        "그려줘",
        "이미지 만들어",
        "사진 만들어",
        "그림으로",
        "draw",
        "generate image",
        "create image",
        "make a picture",
    ];

    const lowerMessage = message.toLowerCase();
    return imageKeywords.some(keyword =>
        lowerMessage.includes(keyword.toLowerCase())
    );
}

/**
 * Extract image prompt from user message
 */
export function extractImagePrompt(message: string): string {
    // Remove the command phrases
    const commandPhrases = [
        "그림 그려줘",
        "그려줘",
        "그림으로 그려줘",
        "이미지 만들어줘",
        "사진 만들어줘",
        "그림을 그려줘",
    ];

    let prompt = message;
    for (const phrase of commandPhrases) {
        prompt = prompt.replace(new RegExp(phrase, "gi"), "").trim();
    }

    return prompt || message;
}
