export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone_number: string | null
          date_of_birth: string | null
          pregnancy_week: number | null
          due_date: string | null
          medical_history: string[] | null
          allergies: string[] | null
          current_medications: string[] | null
          created_at: string
          updated_at: string
          last_login_at: string | null
          preferences: Json | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone_number?: string | null
          date_of_birth?: string | null
          pregnancy_week?: number | null
          due_date?: string | null
          medical_history?: string[] | null
          allergies?: string[] | null
          current_medications?: string[] | null
          created_at: string
          updated_at: string
          last_login_at?: string | null
          preferences?: Json | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone_number?: string | null
          date_of_birth?: string | null
          pregnancy_week?: number | null
          due_date?: string | null
          medical_history?: string[] | null
          allergies?: string[] | null
          current_medications?: string[] | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          preferences?: Json | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          created_at: string
          updated_at: string
          last_message_at: string | null
          message_count: number
          status: 'active' | 'archived' | 'deleted'
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          created_at?: string
          updated_at?: string
          last_message_at?: string | null
          message_count?: number
          status?: 'active' | 'archived' | 'deleted'
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          created_at?: string
          updated_at?: string
          last_message_at?: string | null
          message_count?: number
          status?: 'active' | 'archived' | 'deleted'
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata: Json | null
          created_at: string
          updated_at: string
          tokens_used: number | null
          response_time_ms: number | null
          rag_sources: Json | null
          satisfaction_rating: number | null
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
          tokens_used?: number | null
          response_time_ms?: number | null
          rag_sources?: Json | null
          satisfaction_rating?: number | null
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
          tokens_used?: number | null
          response_time_ms?: number | null
          rag_sources?: Json | null
          satisfaction_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      medical_knowledge: {
        Row: {
          id: string
          title: string
          content: string
          category: string
          tags: string[] | null
          source_url: string | null
          source_type: 'official_guideline' | 'medical_journal' | 'expert_review' | 'faq'
          language: string
          created_at: string
          updated_at: string
          version: string | null
          embedding: string | null
          popularity_score: number | null
        }
        Insert: {
          id?: string
          title: string
          content: string
          category: string
          tags?: string[] | null
          source_url?: string | null
          source_type: 'official_guideline' | 'medical_journal' | 'expert_review' | 'faq'
          language?: string
          created_at?: string
          updated_at?: string
          version?: string | null
          embedding?: string | null
          popularity_score?: number | null
        }
        Update: {
          id?: string
          title?: string
          content?: string
          category?: string
          tags?: string[] | null
          source_url?: string | null
          source_type?: 'official_guideline' | 'medical_journal' | 'expert_review' | 'faq'
          language?: string
          created_at?: string
          updated_at?: string
          version?: string | null
          embedding?: string | null
          popularity_score?: number | null
        }
        Relationships: []
      }
      user_analytics: {
        Row: {
          id: string
          user_id: string
          session_count: number
          total_messages: number
          average_session_duration: number
          most_asked_topics: string[] | null
          last_active_at: string
          satisfaction_rating: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_count?: number
          total_messages?: number
          average_session_duration?: number
          most_asked_topics?: string[] | null
          last_active_at: string
          satisfaction_rating?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_count?: number
          total_messages?: number
          average_session_duration?: number
          most_asked_topics?: string[] | null
          last_active_at?: string
          satisfaction_rating?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_analytics_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}