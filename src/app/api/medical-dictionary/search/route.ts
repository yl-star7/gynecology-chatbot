// Medical Dictionary Search API
// Handles various search methods: text, semantic, category, tags

import { NextRequest, NextResponse } from 'next/server'
import MedicalDictionaryService from '@/lib/medical-dictionary'
import { createClient } from '@/lib/supabase-server'
import type { MedicalSearchParams } from '@/types/medical-dictionary'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      query,
      category,
      tags,
      pregnancy_week,
      pregnancy_related,
      verified_only,
      limit = 10,
      offset = 0,
      search_type = 'text'
    } = body as MedicalSearchParams & { search_type?: string }

    // Get user ID for logging (optional)
    let userId: string | null = null
    try {
      const supabase = await createClient()
      if (supabase?.auth) {
        const { data: { user } } = await supabase.auth.getUser()
        userId = user?.id || null
      }
    } catch {
      // Supabase not configured, continue without user tracking
      console.log('Supabase auth not available, continuing without user tracking')
    }

    let result
    
    switch (search_type) {
      case 'text':
        if (!query) {
          return NextResponse.json(
            { error: 'Query is required for text search' },
            { status: 400 }
          )
        }
        result = await MedicalDictionaryService.searchByText(query, {
          category,
          tags,
          pregnancy_week,
          pregnancy_related,
          verified_only,
          limit,
          offset
        })
        break

      case 'category':
        if (!category) {
          return NextResponse.json(
            { error: 'Category is required for category search' },
            { status: 400 }
          )
        }
        result = await MedicalDictionaryService.getByCategory(category, limit, offset)
        break

      case 'tags':
        if (!tags || tags.length === 0) {
          return NextResponse.json(
            { error: 'Tags are required for tag search' },
            { status: 400 }
          )
        }
        result = await MedicalDictionaryService.getByTags(tags, limit, offset)
        break

      case 'pregnancy_week':
        if (pregnancy_week === undefined) {
          return NextResponse.json(
            { error: 'Pregnancy week is required' },
            { status: 400 }
          )
        }
        const weekInfo = await MedicalDictionaryService.getPregnancyWeekInfo(pregnancy_week)
        result = {
          entries: weekInfo,
          total: weekInfo.length
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid search type' },
          { status: 400 }
        )
    }

    // Log search for analytics (non-blocking)
    if (userId && query) {
      MedicalDictionaryService.logSearch(
        userId,
        query,
        search_type as "text" | "semantic" | "tag" | "category",
        result.total,
        request.headers.get('x-session-id') || undefined
      ).catch(console.error)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Medical dictionary search error:', error)
    return NextResponse.json(
      { error: 'Failed to search medical dictionary' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (id) {
      // Get single entry by ID
      const entry = await MedicalDictionaryService.getEntry(id)
      if (!entry) {
        return NextResponse.json(
          { error: 'Entry not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(entry)
    }

    // Get trending terms
    const trending = searchParams.get('trending')
    if (trending === 'true') {
      const terms = await MedicalDictionaryService.getTrendingTerms(10)
      return NextResponse.json({ terms })
    }

    return NextResponse.json(
      { error: 'Invalid request parameters' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Medical dictionary GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch medical dictionary data' },
      { status: 500 }
    )
  }
}