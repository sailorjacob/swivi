import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 MINIMAL VERIFY TEST - Starting')
    
    const { user, error } = await getServerUserWithRole(request)
    console.log('Auth check:', { hasUser: !!user, error: error?.message })

    if (!user?.id || error) {
      console.log('❌ Auth failed')
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Get the database user ID
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true }
    })
    console.log('DB user check:', { found: !!dbUser })

    if (!dbUser) {
      console.log('❌ DB user not found')
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      )
    }

    // Parse request body exactly like generate endpoint
    console.log('📥 Parsing request body...')
    const body = await request.json()
    console.log('✅ Body parsed:', body)
    
    const { platform, username, code } = body
    console.log('Fields:', { platform, username, hasCode: !!code })

    if (!platform || !['instagram', 'youtube', 'tiktok', 'twitter', 'x'].includes(platform)) {
      console.log('❌ Invalid platform')
      return NextResponse.json(
        { error: "Invalid platform" },
        { status: 400 }
      )
    }

    if (!username) {
      console.log('❌ Missing username')
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      )
    }

    console.log('✅ All validation passed!')
    
    return NextResponse.json({
      success: true,
      message: "Minimal test passed!",
      debug: {
        platform,
        username,
        hasCode: !!code,
        userId: user.id,
        dbUserId: dbUser.id
      }
    })

  } catch (error) {
    console.error('❌ Minimal test error:', error)
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
