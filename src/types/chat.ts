export interface ChatContext {
  conversationId?: string;
  pregnancyWeek?: number;
  medicalHistory?: string[];
  currentConditions?: string[];
  medications?: string[];
  userId?: string;
  symptoms?: string[];
  previousConditions?: string[];
  userType?: 'pregnant' | 'trying_to_conceive' | 'general';
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  messageType?: 'text' | 'image' | 'file';
  isUser?: boolean;
  username?: string;
  createdAt?: Date;
}

export interface ChatRequest {
  messages: Message[];
  conversationId?: string;
  context?: ChatContext;
  stream?: boolean;
}

export interface ChatSettings {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  systemPrompt?: string;
}

export interface MedicalWarning {
  severity: 'info' | 'warning' | 'urgent';
  message: string;
  action?: string;
}

export interface RAGSource {
  id: string;
  title: string;
  content: string;
  url?: string;
  relevanceScore: number;
  category: string;
  lastUpdated?: Date;
}
