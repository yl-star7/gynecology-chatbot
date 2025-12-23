/**
 * LangChain Integration with Vercel AI SDK
 * Hybrid approach: LangChain for RAG/agents, Vercel AI SDK for streaming
 */

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import type { AIPersona, Message } from "@gynecology-chatbot/types";
import { searchPregnancyDocuments, buildRAGContext } from "@/lib/rag";

// Initialize Gemini model via LangChain
const model = new ChatGoogleGenerativeAI({
    modelName: "gemini-2.0-flash",
    temperature: 0.7,
    maxOutputTokens: 2048,
    apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Create RAG-enhanced chat chain
 */
export async function createMedicalRAGChain(persona: AIPersona) {
    const systemTemplate = `${persona.system_prompt}

사용자의 임신 주차와 관련된 의료 지식베이스를 참고하여 정확한 정보를 제공하세요.
응급 상황으로 판단되면 즉시 병원 방문을 권유하세요.

{context}`;

    const prompt = ChatPromptTemplate.fromMessages([
        ["system", systemTemplate],
        new MessagesPlaceholder("chat_history"),
        ["human", "{input}"],
    ]);

    const chain = RunnableSequence.from([
        RunnablePassthrough.assign({
            context: async (input: { input: string; pregnancyWeek?: number }) => {
                const sources = await searchPregnancyDocuments(
                    input.input,
                    input.pregnancyWeek,
                    5
                );
                return buildRAGContext(sources);
            },
        }),
        prompt,
        model,
        new StringOutputParser(),
    ]);

    return chain;
}

/**
 * Convert Message array to LangChain message format
 */
export function convertToLangChainMessages(messages: Message[]) {
    return messages.map((msg) => {
        switch (msg.role) {
            case "user":
                return new HumanMessage(msg.content);
            case "assistant":
                return new AIMessage(msg.content);
            case "system":
                return new SystemMessage(msg.content);
            default:
                return new HumanMessage(msg.content);
        }
    });
}

/**
 * Stream response using LangChain with Vercel AI SDK compatibility
 */
export async function* streamMedicalResponse(
    chain: RunnableSequence,
    input: string,
    chatHistory: Message[],
    pregnancyWeek?: number
): AsyncGenerator<string> {
    const langchainHistory = convertToLangChainMessages(chatHistory);

    const stream = await chain.stream({
        input,
        chat_history: langchainHistory,
        pregnancyWeek,
    });

    for await (const chunk of stream) {
        yield chunk;
    }
}

/**
 * Get non-streaming response for simpler use cases
 */
export async function getMedicalResponse(
    chain: RunnableSequence,
    input: string,
    chatHistory: Message[],
    pregnancyWeek?: number
): Promise<string> {
    const langchainHistory = convertToLangChainMessages(chatHistory);

    const response = await chain.invoke({
        input,
        chat_history: langchainHistory,
        pregnancyWeek,
    });

    return response;
}

/**
 * Create proactive conversation message based on user context
 */
export async function generateProactiveMessage(
    persona: AIPersona,
    pregnancyWeek: number,
    lastInteractionDate: Date
): Promise<string> {
    const daysSinceLastInteraction = Math.floor(
        (Date.now() - lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            `${persona.system_prompt}
      
당신은 사용자에게 선제적으로 대화를 시작하는 AI입니다.
사용자의 임신 ${pregnancyWeek}주차에 맞는 따뜻한 인사와 함께 선택지가 있는 질문을 해주세요.
마지막 대화로부터 ${daysSinceLastInteraction}일이 지났습니다.

다음 형식으로 응답하세요:
1. 짧은 인사
2. 오늘 기분이나 상태를 물어보는 질문
3. 2-3개의 선택지 제공

이모지를 적절히 사용하세요.`,
        ],
        ["human", "오늘의 인사 메시지를 생성해주세요."],
    ]);

    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    return await chain.invoke({});
}
