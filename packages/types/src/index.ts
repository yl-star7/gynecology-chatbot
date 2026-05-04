// Shared types for gynecology-chatbot monorepo

// ============ Database Types ============

export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  pregnancy_week?: number;
  due_date?: string;
  medical_history?: string[];
  allergies?: string[];
  current_medications?: string[];
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  preferences: UserPreferences;
  // New fields for extension
  onboarding_completed: boolean;
  onboarding_data: OnboardingData;
  ai_persona_id: string;
  push_token?: string;
  push_enabled: boolean;
  kakao_id?: string;
  auth_provider: 'email' | 'kakao';
}

export interface UserPreferences {
  language: string;
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  voiceEnabled: boolean;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface OnboardingData {
  pregnancyStatus?: 'pregnant' | 'trying' | 'general';
  pregnancyWeek?: number;
  dueDate?: string;
  firstPregnancy?: boolean;
  ageGroup?: '20s' | '30s' | '40s' | '50+';
  healthConcerns?: string[];
  preferredCommunicationStyle?: 'formal' | 'friendly' | 'concise';
  completedAt?: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  message_count: number;
  status: 'active' | 'archived' | 'deleted';
  metadata: Record<string, unknown>;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  tokens_used?: number;
  response_time_ms?: number;
  rag_sources?: RAGSource[];
  satisfaction_rating?: number;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  type: 'image' | 'document' | 'ai_generated';
  url: string;
  filename: string;
  size_bytes?: number;
  mime_type?: string;
}

export interface RAGSource {
  id: string;
  title: string;
  content: string;
  similarity: number;
  pregnancy_week?: number;
  category: string;
}

// ============ AI Persona Types ============

export interface AIPersona {
  id: string;
  name: string;
  description?: string;
  system_prompt: string;
  tone: 'warm' | 'professional' | 'concise';
  emoji_enabled: boolean;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============ Saved Message Types ============

export interface SavedMessage {
  id: string;
  user_id: string;
  message_id: string;
  conversation_id: string;
  title?: string;
  note?: string;
  tags?: string[];
  is_shared: boolean;
  share_token?: string;
  share_expires_at?: string;
  created_at: string;
}

// ============ Survey Types ============

export interface SurveyTemplate {
  id: string;
  title: string;
  description?: string;
  pregnancy_week_range?: [number, number]; // [min, max]
  questions: SurveyQuestion[];
  is_ai_assisted: boolean;
  ai_follow_up_prompt?: string;
  created_at: string;
  updated_at: string;
}

export interface SurveyQuestion {
  id: string;
  type: 'single_choice' | 'multi_choice' | 'scale' | 'text' | 'ai_dynamic';
  question: string;
  options?: string[];
  scale?: { min: number; max: number; labels?: { min: string; max: string } };
  required: boolean;
  ai_context?: string;
}

export interface SurveyResponse {
  id: string;
  user_id: string;
  template_id: string;
  responses: Record<string, string | string[] | number>;
  ai_generated_questions?: SurveyQuestion[];
  pregnancy_week?: number;
  completed_at?: string;
  created_at: string;
}

// ============ Proactive Conversation Types ============

export interface ProactiveConversation {
  id: string;
  user_id: string;
  trigger_type: 'daily_check' | 'milestone' | 'symptom_follow_up';
  scheduled_at: string;
  sent_at?: string;
  message_content: string;
  conversation_id?: string;
  status: 'pending' | 'sent' | 'read' | 'responded';
  created_at: string;
}

// ============ Pregnancy Document (RAG) Types ============

export interface PregnancyDocument {
  id: string;
  title: string;
  content: string;
  pregnancy_week?: number;
  category: string;
  source_file?: string;
  embedding?: number[]; // 1024 dimensions
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ============ API Types ============

export interface ChatRequest {
  message: string;
  conversationId?: string;
  attachments?: File[];
  generateImage?: boolean;
}

export interface ChatResponse {
  message: Message;
  conversationId: string;
  ragSources?: RAGSource[];
}

export interface OnboardingRequest {
  data: Partial<OnboardingData>;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}
