/**
 * Document Ingestion Service
 * Parses DOCX files and ingests them into pgvector RAG
 */

import mammoth from "mammoth";
import { ingestDocument } from "./pgvector-rag";

interface IngestOptions {
    title: string;
    category: string;
    pregnancyWeek?: number;
    sourceFile: string;
}

/**
 * Parse DOCX file buffer and extract text
 */
export async function parseDocx(buffer: ArrayBuffer): Promise<string> {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value;
}

/**
 * Ingest DOCX file into RAG system
 */
export async function ingestDocxFile(
    fileBuffer: ArrayBuffer,
    options: IngestOptions
): Promise<void> {
    const content = await parseDocx(fileBuffer);

    if (!content.trim()) {
        throw new Error("DOCX file is empty or could not be parsed");
    }

    await ingestDocument(
        content,
        options.title,
        options.category,
        options.pregnancyWeek,
        options.sourceFile
    );
}

/**
 * Bulk ingest multiple DOCX files
 */
export async function bulkIngestDocxFiles(
    files: Array<{
        buffer: ArrayBuffer;
        options: IngestOptions;
    }>
): Promise<{
    success: string[];
    failed: Array<{ file: string; error: string }>;
}> {
    const success: string[] = [];
    const failed: Array<{ file: string; error: string }> = [];

    for (const file of files) {
        try {
            await ingestDocxFile(file.buffer, file.options);
            success.push(file.options.sourceFile);
        } catch (error) {
            failed.push({
                file: file.options.sourceFile,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    return { success, failed };
}

/**
 * Extract pregnancy week from filename pattern
 * e.g., "week_12_guide.docx" -> 12
 */
export function extractPregnancyWeekFromFilename(
    filename: string
): number | undefined {
    const patterns = [
        /week[_\s-]?(\d+)/i,
        /(\d+)주차/,
        /(\d+)주/,
        /w(\d+)/i,
    ];

    for (const pattern of patterns) {
        const match = filename.match(pattern);
        if (match) {
            const week = parseInt(match[1], 10);
            if (week >= 1 && week <= 42) {
                return week;
            }
        }
    }

    return undefined;
}

/**
 * Detect category from content keywords
 */
export function detectCategory(content: string): string {
    const categoryKeywords: Record<string, string[]> = {
        nutrition: ["영양", "식단", "음식", "vitamins", "엽산", "철분"],
        symptoms: ["증상", "입덧", "통증", "붓기", "피로"],
        exercise: ["운동", "스트레칭", "요가", "걷기"],
        checkup: ["검진", "초음파", "검사", "병원"],
        development: ["발달", "태아", "크기", "성장"],
        mental_health: ["정신건강", "스트레스", "우울", "감정"],
        labor: ["출산", "분만", "진통", "준비"],
        postpartum: ["산후", "회복", "모유수유", "아기"],
    };

    const lowerContent = content.toLowerCase();

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        for (const keyword of keywords) {
            if (lowerContent.includes(keyword.toLowerCase())) {
                return category;
            }
        }
    }

    return "general";
}
