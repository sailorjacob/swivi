import { NextRequest, NextResponse } from 'next/server'
import { getServerUserWithRole } from '@/lib/supabase-auth-server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug session endpoint called')
    
    // Check what cookies are available
    const cookies = request.cookies.getAll()
    const supabaseCookies = cookies.filter(c => c.name.startsWith('sb-'))
    
    console.log('🍪 All cookies:', cookies.map(c => c.name))
    console.log('🍪 Supabase cookies:', supabaseCookies.map(c => c.name))
    
    // Check Authorization header
    const authHeader = request.headers.get('authorization')
    console.log('🔑 Authorization header:', authHeader ? 'present' : 'missing')
    
    // Try to get user
    const { user, error } = await getServerUserWithRole(request)
    
    console.log('👤 User result:', {
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
      error: error?.message
    })
    
    return NextResponse.json({
      success: true,
      debug: {
        cookieCount: cookies.length,
        supabaseCookieCount: supabaseCookies.length,
        supabaseCookieNames: supabaseCookies.map(c => c.name),
        hasAuthHeader: !!authHeader,
        hasUser: !!user,
        userEmail: user?.email,
        error: error?.message
      }
    })
    
  } catch (error) {
    console.error('❌ Debug session error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}