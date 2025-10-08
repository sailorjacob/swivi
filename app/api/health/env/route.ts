import { NextResponse } from "next/server"

export async function GET() {
  try {
    const envStatus = {
      NODE_ENV: process.env.NODE_ENV || 'not-set',
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      DATABASE_URL_TYPE: process.env.DATABASE_URL?.includes('pooler.supabase.com') ? 'supabase-pooler' :
                         process.env.DATABASE_URL?.includes('supabase.co') ? 'supabase-direct' : 'other',
      DATABASE_URL_HAS_PGBOUNCER: process.env.DATABASE_URL?.includes('pgbouncer=true') || false,
      NEXT_PUBLIC_SUPABASE_URL_EXISTS: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY_EXISTS: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY_EXISTS: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_SUPABASE_URL_IS_HTTPS: process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://') || false,
      timestamp: new Date().toISOString(),
      
      // Production readiness check
      PRODUCTION_READY: process.env.NODE_ENV === 'production' ?
        !!(process.env.DATABASE_URL &&
           process.env.NEXT_PUBLIC_SUPABASE_URL &&
           process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
           process.env.SUPABASE_SERVICE_ROLE_KEY) : true,

      // Warnings
      WARNINGS: [
        ...(process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL ? ['Missing DATABASE_URL'] : []),
        ...(process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_SUPABASE_URL ? ['Missing NEXT_PUBLIC_SUPABASE_URL'] : []),
        ...(process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? ['Missing NEXT_PUBLIC_SUPABASE_ANON_KEY'] : []),
        ...(process.env.NODE_ENV === 'production' && !process.env.SUPABASE_SERVICE_ROLE_KEY ? ['Missing SUPABASE_SERVICE_ROLE_KEY'] : []),
        ...(process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://') ? ['NEXT_PUBLIC_SUPABASE_URL should use HTTPS'] : []),
        ...(process.env.DATABASE_URL && process.env.DATABASE_URL.includes('pooler.supabase.com') && !process.env.DATABASE_URL.includes('pgbouncer=true') ? ['DATABASE_URL missing pgBouncer parameters'] : [])
      ]
    }

    return NextResponse.json(envStatus)
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check environment',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
