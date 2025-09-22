import { NextRequest, NextResponse } from 'next/server';
import { searchKnowledgeBase } from '@/lib/vertex-rag';

export async function POST(request: NextRequest) {
  try {
    const { query, filters = {} } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: '검색 질의가 필요합니다.' },
        { status: 400 }
      );
    }

    // Vertex AI RAG 검색 수행
    const searchResults = await searchKnowledgeBase(query, {
      maxResults: 5,
      categories: filters?.category ? [filters.category as string] : undefined
    });

    return NextResponse.json({
      success: true,
      results: searchResults,
      query: query
    });

  } catch (error) {
    console.error('RAG Search Error:', error);
    
    return NextResponse.json(
      { 
        error: '지식 검색 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  
  if (!query) {
    return NextResponse.json(
      { error: '검색어를 입력해주세요.' },
      { status: 400 }
    );
  }

  try {
    const searchResults = await searchKnowledgeBase(query, {
      maxResults: 3
    });

    return NextResponse.json({
      success: true,
      results: searchResults,
      query: query
    });

  } catch (error) {
    console.error('RAG Search Error:', error);
    
    return NextResponse.json(
      { 
        error: '지식 검색 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}