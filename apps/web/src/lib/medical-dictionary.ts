// Medical Dictionary Service Layer
// Handles all medical dictionary operations with Supabase

import { createClient } from '@supabase/supabase-js'
import type { 
  MedicalDictionaryEntry, 
  MedicalSearchParams, 
  MedicalSearchResult,
  MedicalCategory,
  Database 
} from '@/types/medical-dictionary'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export class MedicalDictionaryService {
  /**
   * Text-based search using full-text search and trigram matching
   */
  static async searchByText(
    query: string,
    
  ): Promise<MedicalSearchResult> {
    try {
      // Mock data for development (until Supabase tables are created)
      const mockEntries: MedicalDictionaryEntry[] = [
        {
          id: '1',
          term: '입덧',
          term_en: 'Morning Sickness',
          category: '임신증상',
          tags: ['임신초기', '구토', '메스꺼움'],
          related_terms: ['임신', '구역질'],
          content: {
            definition: '임신 초기에 나타나는 구역질과 구토 증상',
            symptoms: ['아침 메스꺼움', '구토', '식욕부진'],
            causes: ['호르몬 변화(hCG 증가)', '에스트로겐 증가'],
            treatment: '생강차, 비타민 B6, 소량 자주 식사',
            prevention: '공복 피하기, 기름진 음식 피하기',
            cautions: ['심한 탈수', '체중 감소'],
            pregnancy_related: true,
            pregnancy_week_relevant: [4, 16] as [number, number]
          },
          metadata: {
            severity: 'medium',
            frequency: 'common',
            department: '산부인과'
          },
          created_at: new Date(),
          updated_at: new Date(),
          is_verified: true
        },
        {
          id: '2',
          term: '임신성 당뇨',
          term_en: 'Gestational Diabetes',
          category: '임신합병증',
          tags: ['당뇨', '혈당', '임신중기'],
          related_terms: ['혈당', '인슐린'],
          content: {
            definition: '임신 중 처음 발견되거나 시작된 당뇨병',
            symptoms: ['과도한 갈증', '빈뇨', '피로감'],
            causes: ['인슐린 저항성 증가', '태반 호르몬'],
            treatment: '식이요법, 운동, 혈당 모니터링',
            prevention: '적정 체중 유지, 균형잡힌 식사',
            cautions: ['거대아', '조산', '제왕절개 가능성'],
            pregnancy_related: true,
            pregnancy_week_relevant: [24, 28] as [number, number]
          },
          metadata: {
            icd_code: 'O24.4',
            severity: 'high',
            frequency: 'common',
            department: '산부인과'
          },
          created_at: new Date(),
          updated_at: new Date(),
          is_verified: true
        }
      ]

      // Filter based on query
      const filtered = mockEntries.filter(entry => 
        entry.term.includes(query) || 
        entry.term_en?.toLowerCase().includes(query.toLowerCase()) ||
        entry.content.definition.includes(query)
      )

      return {
        entries: filtered,
        total: filtered.length,
        relevance_scores: filtered.map(() => 1.0)
      }
    } catch (error) {
      console.error('Medical dictionary search error:', error)
      // Return empty result instead of throwing
      return {
        entries: [],
        total: 0
      }
    }
  }

  /**
   * Semantic search using vector embeddings
   */
  static async searchBySimilarity(
    embedding: number[],
    limit = 10,
    threshold = 0.5
  ): Promise<MedicalSearchResult> {
    try {
      const { data, error } = await supabase
        .rpc('search_medical_similar', {
          query_embedding: embedding,
          limit_count: limit,
          threshold
        })

      if (error) throw error

      const entries: MedicalDictionaryEntry[] = (data || []).map((item: unknown) => ({
        id: item.id,
        term: item.term,
        category: item.category as MedicalCategory,
        content: item.content,
        tags: [],
        related_terms: [],
        metadata: {},
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      }))

      return {
        entries,
        total: entries.length,
        relevance_scores: (data || []).map((item: { similarity: number }) => item.similarity)
      }
    } catch (error) {
      console.error('Semantic search error:', error)
      throw error
    }
  }

  /**
   * Get medical information relevant to a specific pregnancy week
   */
  static async getPregnancyWeekInfo(week: number): Promise<MedicalDictionaryEntry[]> {
    try {
      const { data, error } = await supabase
        .rpc('search_pregnancy_week_info', {
          week_number: week
        })

      if (error) throw error

      return (data || []).map((item: unknown) => ({
        id: item.id,
        term: item.term,
        category: item.category as MedicalCategory,
        content: item.content,
        tags: [],
        related_terms: [],
        metadata: {},
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      }))
    } catch (error) {
      console.error('Pregnancy week info error:', error)
      throw error
    }
  }

  /**
   * Get a single medical dictionary entry by ID
   */
  static async getEntry(id: string): Promise<MedicalDictionaryEntry | null> {
    try {
      const { data, error } = await supabase
        .from('medical_dictionary')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single()

      if (error) throw error
      if (!data) return null

      return {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        deleted_at: data.deleted_at ? new Date(data.deleted_at) : undefined,
        verified_at: data.verified_at ? new Date(data.verified_at) : undefined
      } as MedicalDictionaryEntry
    } catch (error) {
      console.error('Get entry error:', error)
      return null
    }
  }

  /**
   * Get entries by category
   */
  static async getByCategory(
    category: MedicalCategory,
    limit = 20,
    offset = 0
  ): Promise<MedicalSearchResult> {
    try {
      // Return mock data for now
      const mockEntries: MedicalDictionaryEntry[] = [
        {
          id: '1',
          term: '입덧',
          term_en: 'Morning Sickness',
          category: '임신증상',
          tags: ['임신초기', '구토', '메스꺼움'],
          related_terms: ['임신', '구역질'],
          content: {
            definition: '임신 초기에 나타나는 구역질과 구토 증상',
            symptoms: ['아침 메스꺼움', '구토', '식욕부진'],
            causes: ['호르몬 변화(hCG 증가)', '에스트로겐 증가'],
            treatment: '생강차, 비타민 B6, 소량 자주 식사',
            prevention: '공복 피하기, 기름진 음식 피하기',
            cautions: ['심한 탈수', '체중 감소'],
            pregnancy_related: true,
            pregnancy_week_relevant: [4, 16] as [number, number]
          },
          metadata: {
            severity: 'medium',
            frequency: 'common',
            department: '산부인과'
          },
          created_at: new Date(),
          updated_at: new Date(),
          is_verified: true
        }
      ]

      const filtered = mockEntries.filter(entry => entry.category === category)

      return {
        entries: filtered.slice(offset, offset + limit),
        total: filtered.length
      }
    } catch (error) {
      console.error('Get by category error:', error)
      return {
        entries: [],
        total: 0
      }
    }
  }

  /**
   * Get entries by tags
   */
  static async getByTags(
    tags: string[],
    limit = 20,
    offset = 0
  ): Promise<MedicalSearchResult> {
    try {
      const { data, error, count } = await supabase
        .from('medical_dictionary')
        .select('*', { count: 'exact' })
        .overlaps('tags', tags)
        .is('deleted_at', null)
        .order('term', { ascending: true })
        .range(offset, offset + limit - 1)

      if (error) throw error

      const entries: MedicalDictionaryEntry[] = (data || []).map((item: unknown) => ({
        ...item,
        created_at: new Date(item.created_at),
        updated_at: new Date(item.updated_at),
        deleted_at: item.deleted_at ? new Date(item.deleted_at) : undefined,
        verified_at: item.verified_at ? new Date(item.verified_at) : undefined
      }))

      return {
        entries,
        total: count || 0
      }
    } catch (error) {
      console.error('Get by tags error:', error)
      throw error
    }
  }

  /**
   * Get popular/trending terms based on search history
   */
  static async getTrendingTerms(limit = 10): Promise<string[]> {
    try {
      // Return mock trending terms for now
      return ['입덧', '임신성 당뇨', '태동', '양수검사', '임신중독증', '출산준비'].slice(0, limit)
    } catch (error) {
      console.error('Get trending terms error:', error)
      return []
    }
  }

  /**
   * Log a search to history for analytics
   */
  static async logSearch(
    userId: string | null,
    query: string,
    searchType: 'text' | 'semantic' | 'tag' | 'category',
    resultsCount: number,
    sessionId?: string
  ): Promise<void> {
    try {
      if (!userId) return // Don't log for anonymous users

      await supabase
        .from('medical_search_history')
        .insert({
          user_id: userId,
          search_query: query,
          search_type: searchType,
          results_count: resultsCount,
          session_id: sessionId
        })
    } catch (error) {
      console.error('Log search error:', error)
      // Don't throw - logging failures shouldn't break the app
    }
  }

  /**
   * Get frequently asked questions
   */
  static async getFAQs(category?: string, limit = 10): Promise<Record<string, unknown>[]> {
    try {
      let query = supabase
        .from('medical_faq')
        .select('*')
        .order('view_count', { ascending: false })
        .limit(limit)

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get FAQs error:', error)
      return []
    }
  }

  /**
   * Increment FAQ view count
   */
  static async incrementFAQView(faqId: string): Promise<void> {
    try {
      // Increment view count directly
      const { data: faq } = await supabase
        .from('medical_faq')
        .select('view_count')
        .eq('id', faqId)
        .single()
      
      if (faq) {
        await supabase
          .from('medical_faq')
          .update({ view_count: (faq.view_count || 0) + 1 })
          .eq('id', faqId)
      }
    } catch (error) {
      console.error('Increment FAQ view error:', error)
    }
  }

  /**
   * Mark FAQ as helpful
   */
  static async markFAQHelpful(faqId: string): Promise<void> {
    try {
      // Increment helpful count directly
      const { data: faq } = await supabase
        .from('medical_faq')
        .select('helpful_count')
        .eq('id', faqId)
        .single()
      
      if (faq) {
        await supabase
          .from('medical_faq')
          .update({ helpful_count: (faq.helpful_count || 0) + 1 })
          .eq('id', faqId)
      }
    } catch (error) {
      console.error('Mark FAQ helpful error:', error)
    }
  }
}

export default MedicalDictionaryService