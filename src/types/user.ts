export interface User {
  id: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  pregnancyWeek?: number;
  dueDate?: Date;
  medicalHistory?: string[];
  allergies?: string[];
  currentMedications?: string[];
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  language: 'ko' | 'en';
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  voiceEnabled: boolean;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error?: string;
}

export interface Session {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
}

export interface UserAnalytics {
  id: string;
  userId: string;
  sessionCount: number;
  totalMessages: number;
  averageSessionDuration: number;
  mostAskedTopics: string[];
  lastActiveAt: Date;
  satisfactionRating?: number;
}