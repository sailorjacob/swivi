// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Complete authentication debug started")

    const results: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      checks: {}
    }

    // 1. Check environment variables
    results.checks.environment_vars = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      DISCORD_CLIENT_ID: !!process.env.DISCORD_CLIENT_ID,
      DISCORD_CLIENT_SECRET: !!process.env.DISCORD_CLIENT_SECRET,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET
    }

    // 2. Check Supabase Auth configuration
    results.checks.supabase_config = {
      supabase_client_exists: true,
      auth_functions_available: true
    }

    // 3. Check session
    let sessionUser, error, sessionResult
    try {
      const result = await getServerUserWithRole()
      sessionUser = result.user
      error = result.error
      sessionResult = result  // Store the full result for later use
      results.checks.session = {
        exists: !!sessionUser,
        user_id: sessionUser?.id || null,
        user_email: sessionUser?.email || null,
        role: sessionUser?.role || null
      }
    } catch (error) {
      results.checks.session = {
        error: error instanceof Error ? error.message : String(error)
      }
    }

    // 4. Check database connection
    try {
      const userCount = await prisma.user.count()
      results.checks.database = {
        connected: true,
        user_count: userCount
      }
    } catch (error) {
      results.checks.database = {
        connected: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }

    // 5. Check if current user exists in database (if session exists)
    if (sessionUser?.id) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: sessionUser.id },
          include: {
            accounts: true,
            socialAccounts: true,
            socialVerifications: true
          }
        })
        
        results.checks.user_in_db = {
          exists: !!user,
          accounts_count: user?.accounts?.length || 0,
          social_accounts_count: user?.socialAccounts?.length || 0,
          social_verifications_count: user?.socialVerifications?.length || 0
        }
      } catch (error) {
        results.checks.user_in_db = {
          error: error instanceof Error ? error.message : String(error)
        }
      }
    }

    // 6. Check request headers
    results.checks.request_info = {
      user_agent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      origin: request.headers.get('origin'),
      host: request.headers.get('host'),
      cookies_present: !!request.headers.get('cookie')
    }

    // 7. Overall status
    const hasSession = !!sessionUser
    const hasDatabase = results.checks.database.connected
    const hasEnvVars = results.checks.environment_vars.DATABASE_URL &&
                      results.checks.environment_vars.NEXTAUTH_SECRET

    results.overall_status = {
      ready_for_auth: hasEnvVars && hasDatabase,
      user_authenticated: hasSession,
      can_use_verification: hasSession && hasDatabase
    }

    if (!hasSession) {
      results.action_required = {
        message: "User needs to log in",
        login_url: `${process.env.NEXTAUTH_URL || 'https://www.swivimedia.com'}/clippers/login`,
        steps: [
          "1. Visit the login URL above",
          "2. Sign in with Discord or Google",
          "3. Return to test the verification flow"
        ]
      }
    }

    return NextResponse.json(results, { status: hasSession ? 200 : 401 })

  } catch (error) {
    console.error("❌ Complete auth debug failed:", error)
    return NextResponse.json({
      error: "Authentication debug failed",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
