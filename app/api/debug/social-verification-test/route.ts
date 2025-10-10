import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug endpoint called')
    
    // Test auth
    const { user, error } = await getServerUserWithRole(request)
    console.log('🔍 Auth result:', { hasUser: !!user, userId: user?.id, error: error?.message })
    
    if (!user?.id || error) {
      return NextResponse.json({ 
        success: false,
        error: "Not authenticated",
        debug: { hasUser: !!user, error: error?.message }
      }, { status: 401 })
    }

    // Test database user lookup
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true, email: true, name: true }
    })
    console.log('🔍 Database user:', { found: !!dbUser, dbUserId: dbUser?.id })

    if (!dbUser) {
      return NextResponse.json({
        success: false,
        error: "User not found in database",
        debug: { supabaseUserId: user.id }
      }, { status: 404 })
    }

    // Test request parsing
    const requestBody = await request.json()
    console.log('🔍 Request body:', requestBody)
    
    const { platform, username, code } = requestBody

    // Test platform mapping
    const platformMap: Record<string, string> = {
      instagram: 'INSTAGRAM',
      youtube: 'YOUTUBE',
      tiktok: 'TIKTOK',
      twitter: 'TWITTER',
      x: 'TWITTER'
    }
    const platformEnum = platformMap[platform?.toLowerCase()]
    console.log('🔍 Platform mapping:', { platform, platformEnum })

    // Test verification lookup
    let verification = null
    if (platformEnum) {
      verification = await prisma.socialVerification.findFirst({
        where: {
          userId: dbUser.id,
          platform: platformEnum as any,
          verified: false,
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      console.log('🔍 Verification lookup:', { found: !!verification, code: verification?.code })
    }

    return NextResponse.json({
      success: true,
      debug: {
        auth: {
          supabaseUserId: user.id,
          email: user.email
        },
        database: {
          dbUserId: dbUser.id,
          dbUserEmail: dbUser.email,
          dbUserName: dbUser.name
        },
        request: {
          platform,
          username,
          hasCode: !!code,
          codeLength: code?.length
        },
        platformMapping: {
          inputPlatform: platform,
          mappedEnum: platformEnum,
          isValidPlatform: !!platformEnum
        },
        verification: {
          found: !!verification,
          code: verification?.code,
          expiresAt: verification?.expiresAt,
          createdAt: verification?.createdAt
        }
      }
    })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      debug: { errorType: error?.constructor?.name }
    }, { status: 500 })
  }
}
