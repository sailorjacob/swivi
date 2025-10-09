import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { env } from "@/lib/env"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Auth flow debug started")
    
    const results: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      url: request.url,
      host: request.headers.get('host'),
      checks: {}
    }

    // 1. Environment variables check
    results.checks.env_vars = {
      has_database_url: !!env.DATABASE_URL,
      has_nextauth_secret: !!env.NEXTAUTH_SECRET,
      has_discord_client_id: !!env.DISCORD_CLIENT_ID,
      has_discord_client_secret: !!env.DISCORD_CLIENT_SECRET,
      nextauth_url: env.NEXTAUTH_URL,
      database_url_prefix: env.DATABASE_URL?.substring(0, 20) + "...",
      discord_client_id_prefix: env.DISCORD_CLIENT_ID?.substring(0, 8) + "..."
    }

    // 2. Supabase Auth configuration check
    results.checks.supabase_auth = {
      has_supabase_url: !!env.NEXT_PUBLIC_SUPABASE_URL,
      has_supabase_anon_key: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      has_service_role_key: !!env.SUPABASE_SERVICE_ROLE_KEY,
      supabase_url_prefix: env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "..."
    }

    // 3. Prisma/Database check
    try {
      const userCount = await prisma.user.count()
      const socialAccountCount = await prisma.socialAccount.count()
      const verificationCount = await prisma.socialVerification.count()
      
      results.checks.database = {
        connected: true,
        user_count: userCount,
        social_account_count: socialAccountCount,
        verification_count: verificationCount
      }
    } catch (error) {
      results.checks.database = {
        connected: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }

    // 4. Session check
    try {
      const { user, error } = await getServerUserWithRole()
      results.checks.session = {
        exists: !!user,
        user_id: user?.id || null,
        user_email: user?.email || null,
        user_name: user?.user_metadata?.full_name || null,
        role: user?.role || null,
        user_role: user?.role || null,
        expires: null, // Supabase doesn't expose expires in the same way
        access_token: !!user // User exists means authenticated
      }

      // If we have a user, check if user exists in database
      if (user?.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { supabaseAuthId: user.id },
            include: {
              socialAccounts: {
                select: {
                  platform: true,
                  username: true,
                  verified: true
                }
              }
            }
          })

          results.checks.user_in_db = {
            exists: !!dbUser,
            id: dbUser?.id,
            email: dbUser?.email,
            name: dbUser?.name,
            role: dbUser?.role,
            created_at: dbUser?.createdAt,
            oauth_accounts: dbUser?.accounts || [],
            social_accounts: dbUser?.socialAccounts || []
          }
        } catch (error) {
          results.checks.user_in_db = {
            error: error instanceof Error ? error.message : String(error)
          }
        }
      }
    } catch (error) {
      results.checks.session = {
        error: error instanceof Error ? error.message : String(error)
      }
    }

    // 5. Request analysis
    const cookies = request.headers.get('cookie') || ''
    const hasSupabaseToken = cookies.includes('sb-') // Supabase auth cookies start with sb-
    
    results.checks.request = {
      has_cookies: !!cookies,
      has_supabase_token: hasSupabaseToken,
      cookie_names: cookies.split(';').map(c => c.trim().split('=')[0]).filter(Boolean),
      user_agent: request.headers.get('user-agent'),
      referer: request.headers.get('referer')
    }

    // 6. Overall assessment
    const hasValidConfig = results.checks.env_vars.has_database_url && 
                          results.checks.supabase_auth.has_supabase_url &&
                          results.checks.supabase_auth.has_supabase_anon_key
    
    const hasWorkingDb = results.checks.database.connected
    const hasSession = results.checks.session.exists
    const userInDb = results.checks.user_in_db?.exists

    results.overall_status = {
      config_valid: hasValidConfig,
      database_working: hasWorkingDb,
      user_authenticated: hasSession,
      user_in_database: userInDb,
      ready_for_verification: hasSession && hasWorkingDb && userInDb
    }

    // 7. Action items
    if (!hasSession) {
      results.action_required = {
        primary_issue: "User not authenticated",
        steps: [
          "1. Visit https://www.swivimedia.com/clippers/login",
          "2. Click 'Sign in with Discord'",
          "3. Complete Discord OAuth flow",
          "4. Check this endpoint again"
        ],
        debug_urls: [
          "https://www.swivimedia.com/api/auth/providers",
          "https://www.swivimedia.com/api/auth/session"
        ]
      }
    } else if (!userInDb) {
      results.action_required = {
        primary_issue: "Session exists but user not in database",
        steps: [
          "1. Sign out completely",
          "2. Clear browser cookies", 
          "3. Sign in again with Discord",
          "4. Check database logs"
        ]
      }
    }

    return NextResponse.json(results, { 
      status: hasSession ? 200 : 401,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error("❌ Auth flow debug failed:", error)
    return NextResponse.json({
      error: "Auth flow debug failed",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
