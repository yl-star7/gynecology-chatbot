/**
 * Chat API with SSE Streaming
 * POST /api/chat
 * 
 * Features:
 * - LangChain + Gemini 2.0 Flash
 * - pgvector RAG (임신 문서 검색)
 * - AI 페르소나 적용
 * - 메시지 저장
 */

import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { searchPregnancyDocuments, buildRAGContext } from "@/lib/rag";
import { isImageRequest, extractImagePrompt, generateImage } from "@/lib/imagen";

async function createSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { messages, conversationId } = await request.json();
    const lastMessage = messages[messages.length - 1];

    // Get user data for personalization
    const { data: userData } = await supabase
      .from("users")
      .select("pregnancy_week, ai_persona_id, onboarding_data")
      .eq("id", user.id)
      .single();

    const pregnancyWeek = userData?.pregnancy_week;
    const personaId = userData?.ai_persona_id || "default";

    // Get AI persona
    const { data: persona } = await supabase
      .from("ai_personas")
      .select("system_prompt, tone, emoji_enabled")
      .eq("id", personaId)
      .single();

    // Check if image generation request
    if (isImageRequest(lastMessage.content)) {
      const imagePrompt = extractImagePrompt(lastMessage.content);
      try {
        const { base64, mimeType } = await generateImage(imagePrompt);

        // Save message with image
        if (conversationId) {
          await supabase.from("messages").insert({
            conversation_id: conversationId,
            role: "assistant",
            content: "이미지를 생성했어요! 🎨",
            attachments: [{
              type: "image",
              url: `data:${mimeType};base64,${base64}`,
              alt: imagePrompt,
            }],
          });
        }

        return new Response(JSON.stringify({
          type: "image",
          image: `data:${mimeType};base64,${base64}`,
          message: "이미지를 생성했어요! 🎨",
        }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (imageError) {
        console.error("Image generation failed:", imageError);
        // Fall through to text response
      }
    }

    // RAG: Search relevant documents
    let ragContext = "";
    let ragSources: Array<{ title: string; similarity: number }> = [];

    if (lastMessage.content.length > 10) {
      const sources = await searchPregnancyDocuments(
        lastMessage.content,
        pregnancyWeek,
        5
      );
      ragContext = buildRAGContext(sources);
      ragSources = sources.map((s) => ({
        title: s.title,
        similarity: s.similarity,
      }));
    }

    // Build system prompt
    const systemPrompt = `${persona?.system_prompt || "당신은 부인과 전문 AI 상담사입니다."}

${pregnancyWeek ? `사용자는 현재 임신 ${pregnancyWeek}주차입니다.` : ""}

${ragContext ? `참고할 의료 정보:\n${ragContext}` : ""}

응급 상황이 의심되면 즉시 병원 방문을 권유하세요.
${persona?.emoji_enabled ? "이모지를 적절히 사용하세요." : ""}`;

    // Create Gemini model
    const model = google("gemini-2.0-flash");

    // Stream response
    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      onFinish: async ({ text }) => {
        // Save messages to database after streaming completes
        if (conversationId) {
          // Save user message
          await supabase.from("messages").insert({
            conversation_id: conversationId,
            role: "user",
            content: lastMessage.content,
          });

          // Save assistant message
          await supabase.from("messages").insert({
            conversation_id: conversationId,
            role: "assistant",
            content: text,
            rag_sources: ragSources.length > 0 ? ragSources : null,
          });

          // Update conversation
          await supabase
            .from("conversations")
            .update({
              last_message_at: new Date().toISOString(),
              message_count: messages.length + 1,
            })
            .eq("id", conversationId);
        }
      },
    });

    // Return SSE stream
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: "Chat failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}