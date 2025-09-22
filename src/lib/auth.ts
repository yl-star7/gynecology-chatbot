import { createClient } from './supabase-client'
import { getServerClient } from './supabase-server'
import type { 
  User, 
  AuthResponse, 
  LoginCredentials, 
  RegisterCredentials,
  UserPreferences 
} from '@/types/user'
import { validateEmail, validatePassword } from './utils'

// Client-side authentication functions
export const authClient = {
  /**
   * Sign up a new user
   */
  async signUp(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const { email, password, fullName, phoneNumber, dateOfBirth } = credentials

      // Validate input
      if (!validateEmail(email)) {
        return { user: null, session: null, error: '유효하지 않은 이메일 형식입니다' }
      }

      const isValidPassword = validatePassword(password)
      if (!isValidPassword) {
        return { 
          user: null, 
          session: null, 
          error: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
        }
      }

      if (!fullName?.trim()) {
        return { user: null, session: null, error: '이름을 입력해주세요' }
      }

      const supabase = createClient()
      
      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phoneNumber,
            date_of_birth: dateOfBirth?.toISOString(),
          }
        }
      })

      if (authError) {
        return { user: null, session: null, error: authError.message }
      }

      if (!authData.user) {
        return { user: null, session: null, error: '회원가입에 실패했습니다' }
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          full_name: fullName,
          phone_number: phoneNumber,
          date_of_birth: dateOfBirth?.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          preferences: {
            language: 'ko' as const,
            fontSize: 'medium' as const,
            highContrast: false,
            voiceEnabled: false,
            notificationsEnabled: true,
            theme: 'light' as const,
          }
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Don't return error here as the user was successfully created
      }

      const user: User = {
        id: authData.user.id,
        email: authData.user.email!,
        fullName,
        phoneNumber,
        dateOfBirth,
        createdAt: new Date(),
        updatedAt: new Date(),
        preferences: {
          language: 'ko',
          fontSize: 'medium',
          highContrast: false,
          voiceEnabled: false,
          notificationsEnabled: true,
          theme: 'light',
        }
      }

      return { 
        user, 
        session: authData.session ? {
          id: authData.session.access_token,
          userId: authData.user.id,
          accessToken: authData.session.access_token,
          refreshToken: authData.session.refresh_token!,
          expiresAt: new Date(authData.session.expires_at! * 1000)
        } : null 
      }
    } catch (error) {
      console.error('Sign up error:', error)
      return { 
        user: null, 
        session: null, 
        error: '회원가입 중 오류가 발생했습니다' 
      }
    }
  },

  /**
   * Sign in user
   */
  async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { email, password } = credentials

      if (!validateEmail(email)) {
        return { user: null, session: null, error: '유효하지 않은 이메일 형식입니다' }
      }

      if (!password) {
        return { user: null, session: null, error: '비밀번호를 입력해주세요' }
      }

      const supabase = createClient()
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          return { user: null, session: null, error: '이메일 또는 비밀번호가 올바르지 않습니다' }
        }
        return { user: null, session: null, error: authError.message }
      }

      if (!authData.user || !authData.session) {
        return { user: null, session: null, error: '로그인에 실패했습니다' }
      }

      // Get user profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      // Update last login time
      await supabase
        .from('users')
        .update({ 
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', authData.user.id)

      const user: User = {
        id: authData.user.id,
        email: authData.user.email!,
        fullName: profileData?.full_name || undefined,
        phoneNumber: profileData?.phone_number || undefined,
        dateOfBirth: profileData?.date_of_birth ? new Date(profileData.date_of_birth) : undefined,
        pregnancyWeek: profileData?.pregnancy_week || undefined,
        dueDate: profileData?.due_date ? new Date(profileData.due_date) : undefined,
        medicalHistory: profileData?.medical_history || undefined,
        allergies: profileData?.allergies || undefined,
        currentMedications: profileData?.current_medications || undefined,
        createdAt: new Date(profileData?.created_at || Date.now()),
        updatedAt: new Date(profileData?.updated_at || Date.now()),
        lastLoginAt: new Date(),
        preferences: (profileData?.preferences as unknown as UserPreferences) || {
          language: 'ko',
          fontSize: 'medium',
          highContrast: false,
          voiceEnabled: false,
          notificationsEnabled: true,
          theme: 'light',
        }
      }

      return { 
        user,
        session: {
          id: authData.session.access_token,
          userId: authData.user.id,
          accessToken: authData.session.access_token,
          refreshToken: authData.session.refresh_token!,
          expiresAt: new Date(authData.session.expires_at! * 1000)
        }
      }
    } catch (error) {
      console.error('Sign in error:', error)
      return { 
        user: null, 
        session: null, 
        error: '로그인 중 오류가 발생했습니다' 
      }
    }
  },

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

      // Get user profile
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
   * Reset password
   */
  async resetPassword(email: string): Promise<{ error?: string }> {
    try {
      if (!validateEmail(email)) {
        return { error: '유효하지 않은 이메일 형식입니다' }
      }

      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      console.error('Reset password error:', error)
      return { error: '비밀번호 재설정 중 오류가 발생했습니다' }
    }
  },

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<{ error?: string }> {
    try {
      const isValidPassword = validatePassword(newPassword)
      if (!isValidPassword) {
        return { error: 'Password must be at least 8 characters with uppercase, lowercase, and number' }
      }

      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error) {
      console.error('Update password error:', error)
      return { error: '비밀번호 변경 중 오류가 발생했습니다' }
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
      if (event === 'SIGNED_IN' && session?.user) {
        const user = await this.getUser()
        callback(user)
      } else if (event === 'SIGNED_OUT') {
        callback(null)
      }
    })

    return subscription
  }
}

// Server-side authentication functions
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

      // Get user profile
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
   * Require authentication (throws if not authenticated)
   */
  async requireAuth(): Promise<User> {
    const user = await this.getUser()
    if (!user) {
      throw new Error('Authentication required')
    }
    return user
  }
}