import { NextRequest } from 'next/server';
import { ChatHandler } from '@/lib/chat-handler';
import { GEMINI_MODELS } from '@/lib/gemini';
import { createRAGFlowClient } from '@/lib/ragflow-client';
import type { Message, ChatRequest } from '@/types/chat';

// Initialize chat handler
const chatHandler = new ChatHandler({
  model: GEMINI_MODELS.PRO,
  useRAG: true,
  streamingEnabled: true,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: '메시지 배열이 필요합니다' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract messages and latest user message
    const messages: Message[] = body.messages;
    const lastUserMessage = messages[messages.length - 1];
    
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      return new Response(
        JSON.stringify({ error: '유효한 사용자 메시지가 필요합니다' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // RAGFlow 검색 실행
    const ragClient = createRAGFlowClient();
    let ragContext = '';
    let citations: string[] = [];

    try {
      const ragResponse = await ragClient.search({
        query: lastUserMessage.content,
        top_k: 5,
        include_citations: true,
        confidence_threshold: 0.7
      });

      if (ragResponse.results.length > 0) {
        ragContext = ragResponse.results
          .map(result => `[출처: ${result.source}]\n${result.content}\n`)
          .join('\n');

        citations = ragResponse.results.map(result => result.citation);
      }
    } catch (ragError) {
      console.error('RAG 검색 오류:', ragError);
      // RAG 실패시에도 일반 응답 진행
    }

    // Create chat request with RAG context
    const chatRequest: ChatRequest = {
      message: lastUserMessage.content,
      conversationId: body.conversationId,
      context: {
        ...body.context,
        ragContext,
        citations
      },
    };

    // Check if streaming is requested
    const isStreaming = body.stream !== false; // Default to true

    if (isStreaming) {
      // Create streaming response for Vercel AI SDK
      const stream = await chatHandler.createStreamResponse(chatRequest, messages);
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      const response = await chatHandler.handleChat(chatRequest, messages);
      
      return new Response(
        JSON.stringify(response),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Chat API error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: '채팅 처리 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Optional: Add OPTIONS for CORS if needed
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}