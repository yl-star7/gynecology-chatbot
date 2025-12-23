/**
 * RAG API - Document Search
 * POST /api/rag
 */

import { NextRequest, NextResponse } from "next/server";
import { searchPregnancyDocuments, buildRAGContext } from "@/lib/rag";

export async function POST(request: NextRequest) {
  try {
    const { query, pregnancyWeek, limit = 5 } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const sources = await searchPregnancyDocuments(
      query,
      pregnancyWeek ? Number(pregnancyWeek) : undefined,
      limit
    );

    const context = buildRAGContext(sources);

    return NextResponse.json({
      sources,
      context,
      totalFound: sources.length,
    });
  } catch (error) {
    console.error("RAG search error:", error);
    return NextResponse.json(
      { error: "Failed to search documents" },
      { status: 500 }
    );
  }
}