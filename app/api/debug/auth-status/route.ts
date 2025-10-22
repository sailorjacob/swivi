// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerUserWithRole } from '@/lib/supabase-auth-server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking authentication status...')
    
    // Check what cookies are available
    const cookies = request.cookies.getAll()
    const supabaseCookies = cookies.filter(c => c.name.startsWith('sb-'))
    
    console.log('🍪 All cookies:', cookies.map(c => c.name))
    console.log('🍪 Supabase cookies:', supabaseCookies.map(c => c.name))
    
    // Check Authorization header
    const authHeader = request.headers.get('authorization')
    console.log('🔑 Authorization header:', authHeader ? 'present' : 'missing')
    
    // Try to get user from Supabase Auth (bypasses database for now)
    const { user, error } = await getServerUserWithRole(request)
    
    console.log('👤 User result:', {
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
      error: error?.message
    })
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      cookies: {
        total: cookies.length,
        supabase: supabaseCookies.length,
        names: supabaseCookies.map(c => c.name)
      },
      authorization: {
        hasHeader: !!authHeader,
        headerPreview: authHeader ? authHeader.substring(0, 20) + '...' : null
      },
      authentication: {
        hasUser: !!user,
        userId: user?.id,
        email: user?.email,
        role: user?.role,
        verified: user?.verified,
        error: error?.message
      },
      status: user ? 'authenticated' : 'unauthenticated',
      recommendations: user ? 
        ['✅ Authentication is working!'] : 
        [
          '❌ No authenticated user found',
          'Check if user is logged in',
          'Verify Supabase cookies are being set',
          'Check if Authorization header is being sent'
        ]
    })
    
  } catch (error) {
    console.error('❌ Error checking auth status:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
