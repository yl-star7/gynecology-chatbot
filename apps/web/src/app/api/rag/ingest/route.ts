/**
 * RAG API - Document Ingestion
 * POST /api/rag/ingest
 * Ingests DOCX files into the RAG system
 */

import { NextRequest, NextResponse } from "next/server";
import {
    ingestDocxFile,
    extractPregnancyWeekFromFilename,
    detectCategory
} from "@/lib/rag";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const title = formData.get("title") as string;
        const category = formData.get("category") as string;
        const pregnancyWeek = formData.get("pregnancyWeek") as string;

        if (!file) {
            return NextResponse.json(
                { error: "File is required" },
                { status: 400 }
            );
        }

        if (!file.name.endsWith(".docx")) {
            return NextResponse.json(
                { error: "Only DOCX files are supported" },
                { status: 400 }
            );
        }

        const buffer = await file.arrayBuffer();

        // Auto-detect pregnancy week from filename if not provided
        const weekFromFilename = extractPregnancyWeekFromFilename(file.name);
        const finalWeek = pregnancyWeek
            ? Number(pregnancyWeek)
            : weekFromFilename;

        // Auto-detect category if not provided
        let finalCategory = category;
        if (!category) {
            const textContent = new TextDecoder().decode(buffer.slice(0, 10000));
            finalCategory = detectCategory(textContent);
        }

        await ingestDocxFile(buffer, {
            title: title || file.name.replace(".docx", ""),
            category: finalCategory || "general",
            pregnancyWeek: finalWeek,
            sourceFile: file.name,
        });

        return NextResponse.json({
            success: true,
            message: "Document ingested successfully",
            details: {
                filename: file.name,
                title: title || file.name,
                category: finalCategory,
                pregnancyWeek: finalWeek,
            },
        });
    } catch (error) {
        console.error("Document ingestion error:", error);
        return NextResponse.json(
            { error: "Failed to ingest document" },
            { status: 500 }
        );
    }
}
