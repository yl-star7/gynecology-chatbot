import { createClientForMiddleware } from '@/lib/supabase-server'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClientForMiddleware(request)

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()

  const url = request.nextUrl.clone()
  const pathname = url.pathname

  // Define protected routes
  const protectedRoutes = ['/chat', '/profile', '/dashboard', '/settings']
  const authRoutes = ['/login', '/register', '/auth']
  
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  )

  // If user is not authenticated and trying to access protected route
  if (!session && isProtectedRoute) {
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return Response.redirect(url)
  }

  // If user is authenticated and trying to access auth routes
  if (session && isAuthRoute && pathname !== '/auth/callback') {
    url.pathname = '/chat'
    return Response.redirect(url)
  }

  // If user is authenticated but trying to access root, redirect to chat
  if (session && pathname === '/') {
    url.pathname = '/chat'
    return Response.redirect(url)
  }

  // If user is not authenticated and accessing root, redirect to login
  if (!session && pathname === '/') {
    url.pathname = '/login'
    return Response.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}