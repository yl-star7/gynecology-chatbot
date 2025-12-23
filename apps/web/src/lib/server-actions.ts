import { authServer } from './auth'
import { redirect } from 'next/navigation'
import type { User } from '@/types/user'

/**
 * Server action wrapper that requires authentication
 * @param action The server action to wrap
 * @returns Wrapped server action that ensures user is authenticated
 */
export function withAuth<T extends unknown[], R>(
  action: (user: User, ...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const user = await authServer.getUser()
    
    if (!user) {
      redirect('/login')
    }
    
    return action(user, ...args)
  }
}

/**
 * Server action wrapper that optionally uses authenticated user
 * @param action The server action to wrap
 * @returns Wrapped server action with optional user parameter
 */
export function withOptionalAuth<T extends unknown[], R>(
  action: (user: User | null, ...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const user = await authServer.getUser()
    return action(user, ...args)
  }
}

/**
 * Utility function to require authentication in server components
 * @returns Authenticated user
 * @throws Redirects to login if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await authServer.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return user
}

/**
 * Utility function to get current user in server components
 * @returns User or null
 */
export async function getCurrentUser(): Promise<User | null> {
  return authServer.getUser()
}

/**
 * Utility function to check authentication status in server components
 * @returns Boolean indicating if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  return authServer.isAuthenticated()
}