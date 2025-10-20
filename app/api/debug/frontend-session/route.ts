// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { hasSession, sessionData } = body
    
    console.log('🔍 Frontend session debug:', {
      hasSession,
      hasUser: !!sessionData?.user,
      hasAccessToken: !!sessionData?.access_token,
      userEmail: sessionData?.user?.email
    })
    
    return NextResponse.json({
      success: true,
      message: 'Frontend session data received',
      serverSideCheck: {
        receivedSession: hasSession,
        receivedUser: !!sessionData?.user,
        receivedToken: !!sessionData?.access_token
      }
    })
    
  } catch (error) {
    console.error('❌ Frontend session debug error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
