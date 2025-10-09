import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Simple Profile: Starting...')
    
    const { user, error } = await getServerUserWithRole(request)
    
    if (!user || error) {
      console.log('❌ Simple Profile: Auth failed:', error?.message)
      return NextResponse.json({ 
        success: false, 
        error: "Authentication failed",
        details: error?.message 
      }, { status: 401 })
    }

    console.log('✅ Simple Profile: Auth success for user:', user.id)
    
    // Return basic user info without database query
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || 'No name',
        image: user.image || 'No image',
        role: user.role || 'CLIPPER'
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Simple Profile: Error:', error)
    return NextResponse.json({ 
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
