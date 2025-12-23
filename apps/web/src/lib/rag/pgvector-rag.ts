/**
 * pgvector RAG Client for Pregnancy Documents
 * Uses Gemini embeddings (1536 dimensions) and Supabase pgvector
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { RAGSource, PregnancyDocument } from "@gynecology-chatbot/types";

// Gemini embedding dimension as per CLAUDE.md requirement
const EMBEDDING_DIMENSION = 1536;

/**
 * Create Supabase server client for RAG operations
 */
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

/**
 * Generate embedding using Gemini text-embedding-004 model
 * @param text - Text to embed
 * @returns 1536-dimension embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "models/text-embedding-004",
                content: {
                    parts: [{ text }],
                },
                taskType: "RETRIEVAL_DOCUMENT",
                title: "Pregnancy Medical Information",
                outputDimensionality: EMBEDDING_DIMENSION,
            }),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to generate embedding: ${error}`);
    }

    const data = await response.json();
    return data.embedding.values;
}

/**
 * Generate embedding for query (uses different task type)
 */
export async function generateQueryEmbedding(text: string): Promise<number[]> {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "models/text-embedding-004",
                content: {
                    parts: [{ text }],
                },
                taskType: "RETRIEVAL_QUERY",
                outputDimensionality: EMBEDDING_DIMENSION,
            }),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to generate query embedding: ${error}`);
    }

    const data = await response.json();
    return data.embedding.values;
}

/**
 * Search pregnancy documents using vector similarity
 * @param query - User's query text
 * @param pregnancyWeek - Optional filter by pregnancy week
 * @param limit - Maximum number of results
 * @returns Array of matching documents with similarity scores
 */
export async function searchPregnancyDocuments(
    query: string,
    pregnancyWeek?: number,
    limit: number = 5
): Promise<RAGSource[]> {
    const supabase = await createSupabaseClient();
    const queryEmbedding = await generateQueryEmbedding(query);

    const { data, error } = await supabase.rpc("match_pregnancy_documents", {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: limit,
        filter_week: pregnancyWeek || null,
    });

    if (error) {
        console.error("RAG search error:", error);
        throw error;
    }

    return (data || []).map((doc: {
        id: string;
        title: string;
        content: string;
        similarity: number;
        pregnancy_week?: number;
        category: string;
    }) => ({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        similarity: doc.similarity,
        pregnancy_week: doc.pregnancy_week,
        category: doc.category,
    }));
}

/**
 * Ingest a document into the RAG system
 * Splits content into chunks and generates embeddings
 */
export async function ingestDocument(
    content: string,
    title: string,
    category: string,
    pregnancyWeek?: number,
    sourceFile?: string,
    chunkSize: number = 1000,
    chunkOverlap: number = 200
): Promise<void> {
    const supabase = await createSupabaseClient();

    // Split content into chunks
    const chunks = splitIntoChunks(content, chunkSize, chunkOverlap);

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkTitle = chunks.length > 1 ? `${title} (Part ${i + 1})` : title;

        const embedding = await generateEmbedding(chunk);

        const { error } = await supabase.from("pregnancy_documents").insert({
            title: chunkTitle,
            content: chunk,
            pregnancy_week: pregnancyWeek,
            category,
            source_file: sourceFile,
            embedding,
            metadata: {
                chunk_index: i,
                total_chunks: chunks.length,
                original_title: title,
            },
        });

        if (error) {
            console.error(`Error ingesting chunk ${i}:`, error);
            throw error;
        }
    }
}

/**
 * Split text into overlapping chunks
 */
function splitIntoChunks(
    text: string,
    chunkSize: number,
    overlap: number
): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/);

    let currentChunk = "";

    for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());

            // Keep overlap from the end of current chunk
            const words = currentChunk.split(" ");
            const overlapWords = Math.ceil(overlap / 5); // Approximate words for overlap
            currentChunk = words.slice(-overlapWords).join(" ") + " " + sentence;
        } else {
            currentChunk += (currentChunk ? " " : "") + sentence;
        }
    }

    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

/**
 * Build context from RAG sources for LLM prompt
 */
export function buildRAGContext(sources: RAGSource[]): string {
    if (sources.length === 0) {
        return "";
    }

    const contextParts = sources.map((source, index) => {
        const weekInfo = source.pregnancy_week
            ? `(임신 ${source.pregnancy_week}주차 관련)`
            : "(일반 정보)";
        return `[출처 ${index + 1}] ${source.title} ${weekInfo}\n${source.content}`;
    });

    return `
의료 지식 베이스에서 찾은 관련 정보:

${contextParts.join("\n\n---\n\n")}

위 정보를 참고하여 사용자의 질문에 답변해주세요.
`;
}

/**
 * Delete documents by source file
 */
export async function deleteDocumentsBySourceFile(
    sourceFile: string
): Promise<void> {
    const supabase = await createSupabaseClient();

    const { error } = await supabase
        .from("pregnancy_documents")
        .delete()
        .eq("source_file", sourceFile);

    if (error) {
        throw error;
    }
}

/**
 * Get document statistics
 */
export async function getDocumentStats(): Promise<{
    totalDocuments: number;
    byCategory: Record<string, number>;
    byWeek: Record<string, number>;
}> {
    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
        .from("pregnancy_documents")
        .select("category, pregnancy_week");

    if (error) {
        throw error;
    }

    const stats = {
        totalDocuments: data.length,
        byCategory: {} as Record<string, number>,
        byWeek: {} as Record<string, number>,
    };

    for (const doc of data) {
        stats.byCategory[doc.category] = (stats.byCategory[doc.category] || 0) + 1;
        if (doc.pregnancy_week) {
            const weekKey = `week_${doc.pregnancy_week}`;
            stats.byWeek[weekKey] = (stats.byWeek[weekKey] || 0) + 1;
        }
    }

    return stats;
}
