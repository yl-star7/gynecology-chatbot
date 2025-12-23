import { createClient } from './supabase-client'
import { getServerClient } from './supabase-server'
import type {
  User,
  UserPreferences
} from '@/types/user'

/**
 * Kakao-centric Authentication Helper
 * Simplified to remove email/password logic as per PRD
 */
export const authClient = {
  /**
   * Sign out user
   */
  async signOut(): Promise<{ error?: string }> {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      console.error('Sign out error:', error)
      return { error: '로그아웃 중 오류가 발생했습니다' }
    }
  },

  /**
   * Get current user
   */
  async getUser(): Promise<User | null> {
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        return null
      }

      // Get user profile from our public.users table
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (!profileData) {
        return null
      }

      const user: User = {
        id: authUser.id,
        email: authUser.email!,
        fullName: profileData.full_name || undefined,
        phoneNumber: profileData.phone_number || undefined,
        dateOfBirth: profileData.date_of_birth ? new Date(profileData.date_of_birth) : undefined,
        pregnancyWeek: profileData.pregnancy_week || undefined,
        dueDate: profileData.due_date ? new Date(profileData.due_date) : undefined,
        medicalHistory: profileData.medical_history || undefined,
        allergies: profileData.allergies || undefined,
        currentMedications: profileData.current_medications || undefined,
        createdAt: new Date(profileData.created_at),
        updatedAt: new Date(profileData.updated_at),
        lastLoginAt: profileData.last_login_at ? new Date(profileData.last_login_at) : undefined,
        preferences: (profileData.preferences as unknown as UserPreferences) || {
          language: 'ko',
          fontSize: 'medium',
          highContrast: false,
          voiceEnabled: false,
          notificationsEnabled: true,
          theme: 'light',
        }
      }

      return user
    } catch (error) {
      console.error('Get user error:', error)
      return null
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<User>): Promise<{ user?: User; error?: string }> {
    try {
      const supabase = createClient()

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      }

      if (updates.fullName !== undefined) updateData.full_name = updates.fullName
      if (updates.phoneNumber !== undefined) updateData.phone_number = updates.phoneNumber
      if (updates.dateOfBirth !== undefined) updateData.date_of_birth = updates.dateOfBirth?.toISOString()
      if (updates.pregnancyWeek !== undefined) updateData.pregnancy_week = updates.pregnancyWeek
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate?.toISOString()
      if (updates.medicalHistory !== undefined) updateData.medical_history = updates.medicalHistory
      if (updates.allergies !== undefined) updateData.allergies = updates.allergies
      if (updates.currentMedications !== undefined) updateData.current_medications = updates.currentMedications
      if (updates.preferences !== undefined) updateData.preferences = updates.preferences

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      const user: User = {
        id: data.id,
        email: data.email,
        fullName: data.full_name || undefined,
        phoneNumber: data.phone_number || undefined,
        dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : undefined,
        pregnancyWeek: data.pregnancy_week || undefined,
        dueDate: data.due_date ? new Date(data.due_date) : undefined,
        medicalHistory: data.medical_history || undefined,
        allergies: data.allergies || undefined,
        currentMedications: data.current_medications || undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
        preferences: (data.preferences as unknown as UserPreferences) || undefined
      }

      return { user }
    } catch (error) {
      console.error('Update profile error:', error)
      return { error: '프로필 업데이트 중 오류가 발생했습니다' }
    }
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      return !!session
    } catch (error) {
      console.error('Check auth error:', error)
      return false
    }
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        const user = await this.getUser()
        callback(user)
      } else if (event === 'SIGNED_OUT') {
        callback(null)
      }
    })

    return subscription
  }
}

// Server-side authentication functions (for RSC / API Routes)
export const authServer = {
  /**
   * Get current user on server
   */
  async getUser(): Promise<User | null> {
    try {
      const supabase = await getServerClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        return null
      }

      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (!profileData) {
        return null
      }

      const user: User = {
        id: authUser.id,
        email: authUser.email!,
        fullName: profileData.full_name || undefined,
        phoneNumber: profileData.phone_number || undefined,
        dateOfBirth: profileData.date_of_birth ? new Date(profileData.date_of_birth) : undefined,
        pregnancyWeek: profileData.pregnancy_week || undefined,
        dueDate: profileData.due_date ? new Date(profileData.due_date) : undefined,
        medicalHistory: profileData.medical_history || undefined,
        allergies: profileData.allergies || undefined,
        currentMedications: profileData.current_medications || undefined,
        createdAt: new Date(profileData.created_at),
        updatedAt: new Date(profileData.updated_at),
        lastLoginAt: profileData.last_login_at ? new Date(profileData.last_login_at) : undefined,
        preferences: (profileData.preferences as unknown as UserPreferences) || {
          language: 'ko',
          fontSize: 'medium',
          highContrast: false,
          voiceEnabled: false,
          notificationsEnabled: true,
          theme: 'light',
        }
      }

      return user
    } catch (error) {
      console.error('Server get user error:', error)
      return null
    }
  },

  /**
   * Check if user is authenticated on server
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const supabase = await getServerClient()
      const { data: { session } } = await supabase.auth.getSession()
      return !!session
    } catch (error) {
      console.error('Server check auth error:', error)
      return false
    }
  },

  /**
   * Require authentication
   */
  async requireAuth(): Promise<User> {
    const user = await this.getUser()
    if (!user) {
      throw new Error('Authentication required')
    }
    return user
  }
}