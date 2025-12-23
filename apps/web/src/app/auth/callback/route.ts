import { createClientForRoutes } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirectTo') ?? '/chat'

  if (code) {
    const supabase = await createClientForRoutes()
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL('/login?error=auth_callback_failed', request.url))
    }
  }

  // Redirect to the intended destination
  return NextResponse.redirect(new URL(redirectTo, request.url))
}