// Medical FAQ API
// Handles frequently asked questions

import { NextRequest, NextResponse } from 'next/server'
import MedicalDictionaryService from '@/lib/medical-dictionary'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '10')

    const faqs = await MedicalDictionaryService.getFAQs(
      category || undefined,
      limit
    )

    return NextResponse.json({ faqs })
  } catch (error) {
    console.error('FAQ fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch FAQs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, faqId } = body

    if (!faqId) {
      return NextResponse.json(
        { error: 'FAQ ID is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'view':
        await MedicalDictionaryService.incrementFAQView(faqId)
        return NextResponse.json({ success: true })

      case 'helpful':
        await MedicalDictionaryService.markFAQHelpful(faqId)
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('FAQ action error:', error)
    return NextResponse.json(
      { error: 'Failed to process FAQ action' },
      { status: 500 }
    )
  }
}