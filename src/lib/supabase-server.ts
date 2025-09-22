
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  )
}

// For backward compatibility - export the async function with a different name to avoid conflicts
export const getServerClient = createClient

// For middleware and route handlers
export function createClientForMiddleware(request: Request) {
  const response = new Response(null, {
    status: 200,
    headers: new Headers(request.headers),
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookieString = request.headers.get('cookie') || ''
          return cookieString
            .split(';')
            .map((cookie) => {
              const [name, value] = cookie.trim().split('=')
              return { name, value: decodeURIComponent(value || '') }
            })
            .filter(({ name }) => name)
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieString = `${name}=${encodeURIComponent(value)}; Path=${options?.path || '/'}; ${
              options?.httpOnly ? 'HttpOnly; ' : ''
            }${options?.secure ? 'Secure; ' : ''}${
              options?.sameSite ? `SameSite=${options.sameSite}; ` : ''
            }${options?.maxAge ? `Max-Age=${options.maxAge}; ` : ''}`
            
            response.headers.append('Set-Cookie', cookieString)
          })
        },
      },
    },
  )

  return { supabase, response }
}

// For API routes and server actions
export async function createClientForRoutes() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    },
  )
}