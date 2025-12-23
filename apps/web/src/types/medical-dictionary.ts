// Medical Dictionary Type Definitions
// Matches the hybrid database schema (RDB + JSONB + Vector)

export interface MedicalContent {
  definition: string
  symptoms?: string[]
  causes?: string[]
  treatment?: string
  prevention?: string
  cautions?: string[]
  pregnancy_related?: boolean
  pregnancy_week_relevant?: [number, number] // [start_week, end_week]
  images?: string[]
  references?: string[]
  // Additional flexible fields
  [key: string]: unknown
}

export interface MedicalMetadata {
  icd_code?: string
  severity?: 'low' | 'medium' | 'high'
  frequency?: 'common' | 'uncommon' | 'rare'
  department?: string
  last_reviewed?: string
  reviewer?: string
  // Additional metadata fields
  [key: string]: unknown
}

export interface MedicalDictionaryEntry {
  id: string
  term: string
  term_en?: string
  category: MedicalCategory
  tags: string[]
  related_terms: string[]
  content: MedicalContent
  metadata: MedicalMetadata
  embedding?: number[] // Vector embedding for semantic search
  created_at: Date
  updated_at: Date
  deleted_at?: Date
  is_verified: boolean
  verified_by?: string
  verified_at?: Date
}

export type MedicalCategory = 
  | '질병'
  | '증상'
  | '약물'
  | '검사'
  | '시술'
  | '임신증상'
  | '임신합병증'
  | '영양'
  | '운동'
  | '생활습관'
  | '응급상황'
  | '산전관리'
  | '산후관리'
  | '신생아케어'
  | '기타'

export interface MedicalSearchParams {
  query?: string
  category?: MedicalCategory
  tags?: string[]
  pregnancy_week?: number
  pregnancy_related?: boolean
  verified_only?: boolean
  limit?: number
  offset?: number
}

export interface MedicalSearchResult {
  entries: MedicalDictionaryEntry[]
  total: number
  relevance_scores?: number[]
}

export interface MedicalSearchHistory {
  id: string
  user_id: string
  search_query: string
  search_type: 'text' | 'semantic' | 'tag' | 'category'
  results_count: number
  clicked_result_id?: string
  session_id?: string
  created_at: Date
}

export interface MedicalFAQ {
  id: string
  question: string
  answer: string
  category?: string
  tags: string[]
  related_terms: string[]
  view_count: number
  helpful_count: number
  created_at: Date
  updated_at: Date
}

// Supabase Database Types
export interface Database {
  public: {
    Tables: {
      medical_dictionary: {
        Row: {
          id: string
          term: string
          term_en: string | null
          category: string
          tags: string[] | null
          related_terms: string[] | null
          content: MedicalContent
          metadata: MedicalMetadata | null
          embedding: number[] | null
          search_vector: unknown
          created_at: string
          updated_at: string
          deleted_at: string | null
          is_verified: boolean
          verified_by: string | null
          verified_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['medical_dictionary']['Row'], 'id' | 'search_vector' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['medical_dictionary']['Insert']>
      }
      medical_search_history: {
        Row: {
          id: string
          user_id: string
          search_query: string
          search_type: string | null
          results_count: number | null
          clicked_result_id: string | null
          session_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['medical_search_history']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['medical_search_history']['Insert']>
      }
      medical_faq: {
        Row: {
          id: string
          question: string
          answer: string
          category: string | null
          tags: string[] | null
          related_terms: string[] | null
          view_count: number
          helpful_count: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['medical_faq']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['medical_faq']['Insert']>
      }
    }
    Functions: {
      search_medical_dictionary: {
        Args: {
          search_term: string
          search_category?: string
          search_tags?: string[]
          limit_count?: number
        }
        Returns: {
          id: string
          term: string
          category: string
          tags: string[]
          content: MedicalContent
          relevance: number
        }[]
      }
      search_medical_similar: {
        Args: {
          query_embedding: number[]
          limit_count?: number
          threshold?: number
        }
        Returns: {
          id: string
          term: string
          category: string
          content: MedicalContent
          similarity: number
        }[]
      }
      search_pregnancy_week_info: {
        Args: {
          week_number: number
        }
        Returns: {
          id: string
          term: string
          category: string
          content: MedicalContent
        }[]
      }
    }
  }
}