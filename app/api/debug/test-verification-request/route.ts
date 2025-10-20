// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 TEST: Verification request debug endpoint called')
    
    // Step 1: Test authentication
    console.log('🔍 Step 1: Testing authentication...')
    const { user, error } = await getServerUserWithRole(request)
    console.log('Auth result:', { hasUser: !!user, userId: user?.id, error: error?.message })
    
    if (!user?.id || error) {
      console.log('❌ AUTH FAILED:', { hasUser: !!user, error: error?.message })
      return NextResponse.json({ 
        success: false,
        step: 'authentication',
        error: "Not authenticated",
        debug: { hasUser: !!user, error: error?.message }
      }, { status: 401 })
    }
    console.log('✅ Authentication passed')

    // Step 2: Test database user lookup
    console.log('🔍 Step 2: Testing database user lookup...')
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true, email: true, name: true }
    })
    console.log('Database user result:', { found: !!dbUser, dbUserId: dbUser?.id })

    if (!dbUser) {
      console.log('❌ DATABASE USER NOT FOUND')
      return NextResponse.json({
        success: false,
        step: 'database_lookup',
        error: "User not found in database",
        debug: { supabaseUserId: user.id }
      }, { status: 404 })
    }
    console.log('✅ Database user found')

    // Step 3: Test request body parsing
    console.log('🔍 Step 3: Testing request body parsing...')
    let requestBody
    try {
      requestBody = await request.json()
      console.log('Request body parsed:', requestBody)
    } catch (parseError) {
      console.log('❌ REQUEST BODY PARSE ERROR:', parseError)
      return NextResponse.json({
        success: false,
        step: 'request_parsing',
        error: "Failed to parse request body",
        debug: { parseError: parseError.message }
      }, { status: 400 })
    }
    console.log('✅ Request body parsed successfully')
    
    const { platform, username, code } = requestBody

    // Step 4: Test field validation
    console.log('🔍 Step 4: Testing field validation...')
    console.log('Fields:', { platform, username, hasCode: !!code })
    
    if (!platform || !username) {
      console.log('❌ FIELD VALIDATION FAILED:', { platform, username, hasCode: !!code })
      return NextResponse.json({ 
        success: false,
        step: 'field_validation',
        error: "Missing required fields: platform, username",
        debug: { platform, username, hasCode: !!code }
      }, { status: 400 })
    }
    console.log('✅ Field validation passed')

    // Step 5: Test platform mapping
    console.log('🔍 Step 5: Testing platform mapping...')
    const platformMap: Record<string, string> = {
      instagram: 'INSTAGRAM',
      youtube: 'YOUTUBE',
      tiktok: 'TIKTOK',
      twitter: 'TWITTER',
      x: 'TWITTER'
    }
    const platformEnum = platformMap[platform?.toLowerCase()]
    console.log('Platform mapping:', { 
      inputPlatform: platform, 
      lowerCase: platform?.toLowerCase(),
      mappedEnum: platformEnum,
      isValidPlatform: !!platformEnum 
    })

    if (!platformEnum) {
      console.log('❌ PLATFORM MAPPING FAILED')
      return NextResponse.json({
        success: false,
        step: 'platform_mapping',
        error: `Invalid platform: ${platform}`,
        debug: { platform, availablePlatforms: Object.keys(platformMap) }
      }, { status: 400 })
    }
    console.log('✅ Platform mapping passed')

    // Step 6: Test verification lookup
    console.log('🔍 Step 6: Testing verification lookup...')
    let verification = null
    try {
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
      console.log('Verification lookup result:', { 
        found: !!verification, 
        code: verification?.code,
        expiresAt: verification?.expiresAt,
        verified: verification?.verified
      })
    } catch (dbError) {
      console.log('❌ VERIFICATION LOOKUP ERROR:', dbError)
      return NextResponse.json({
        success: false,
        step: 'verification_lookup',
        error: "Database error during verification lookup",
        debug: { dbError: dbError.message }
      }, { status: 500 })
    }
    console.log('✅ Verification lookup completed')

    // Step 7: Test code determination
    console.log('🔍 Step 7: Testing code determination...')
    let verificationCode = code // Use provided code if available
    
    if (!verificationCode) {
      if (!verification) {
        console.log('❌ NO CODE AND NO VERIFICATION FOUND')
        return NextResponse.json({
          success: false,
          step: 'code_determination',
          error: "No pending verification found. Please generate a new code first.",
          debug: { providedCode: !!code, foundVerification: !!verification }
        }, { status: 404 })
      }
      verificationCode = verification.code
      console.log('Using database verification code:', verificationCode)
    } else {
      console.log('Using provided verification code:', verificationCode)
    }
    console.log('✅ Code determination passed')

    return NextResponse.json({
      success: true,
      message: "All validation steps passed!",
      debug: {
        steps: {
          authentication: '✅ passed',
          database_lookup: '✅ passed', 
          request_parsing: '✅ passed',
          field_validation: '✅ passed',
          platform_mapping: '✅ passed',
          verification_lookup: '✅ passed',
          code_determination: '✅ passed'
        },
        data: {
          auth: {
            supabaseUserId: user.id,
            email: user.email
          },
          database: {
            dbUserId: dbUser.id,
            dbUserEmail: dbUser.email
          },
          request: {
            platform,
            username,
            hasCode: !!code,
            codeLength: code?.length
          },
          platformMapping: {
            inputPlatform: platform,
            mappedEnum: platformEnum
          },
          verification: {
            found: !!verification,
            code: verification?.code,
            expiresAt: verification?.expiresAt
          },
          finalCode: verificationCode
        }
      }
    })

  } catch (error) {
    console.error('❌ TEST ENDPOINT ERROR:', error)
    return NextResponse.json({
      success: false,
      step: 'unknown_error',
      error: error instanceof Error ? error.message : "Unknown error",
      debug: { 
        errorType: error?.constructor?.name,
        stack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 })
  }
}
