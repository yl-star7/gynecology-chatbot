// Global type definitions for the gynecology chatbot

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  pregnancy_week?: number;
  due_date?: string;
  created_at: string;
  updated_at: string;
  medical_conditions?: string[];
  medications?: string[];
  allergies?: string[];
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export type SearchType = 'text' | 'semantic' | 'tag' | 'category';
export type MessageRole = 'user' | 'assistant' | 'system';
export type MedicalSeverity = 'info' | 'warning' | 'urgent' | 'emergency';

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface RequestWithAuth extends Request {
  user?: UserProfile;
}

export interface MedicalSearchResult {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  relevanceScore: number;
  source: string;
  lastUpdated: string;
}

export interface ConversationMetadata {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  tags: string[];
}

export interface MedicalContext {
  pregnancyWeek?: number;
  symptoms?: string[];
  medications?: string[];
  allergies?: string[];
  medicalHistory?: string[];
  emergencyFlags?: string[];
}

export interface ChatRequestBody {
  message: string;
  conversationId?: string;
  context?: MedicalContext;
  streamResponse?: boolean;
}

export interface ImageUploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export interface HealthAnalytics {
  totalChats: number;
  averageResponseTime: number;
  userSatisfaction: number;
  commonTopics: Array<{
    topic: string;
    count: number;
  }>;
  emergencyAlerts: number;
}