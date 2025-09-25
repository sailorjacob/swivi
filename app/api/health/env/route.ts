import { NextResponse } from "next/server"

export async function GET() {
  try {
    const envStatus = {
      NODE_ENV: process.env.NODE_ENV || 'not-set',
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      DATABASE_URL_TYPE: process.env.DATABASE_URL?.includes('pooler.supabase.com') ? 'supabase-pooler' : 
                         process.env.DATABASE_URL?.includes('supabase.co') ? 'supabase-direct' : 'other',
      DATABASE_URL_HAS_PGBOUNCER: process.env.DATABASE_URL?.includes('pgbouncer=true') || false,
      NEXTAUTH_SECRET_EXISTS: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_SECRET_LENGTH: process.env.NEXTAUTH_SECRET?.length || 0,
      DISCORD_CLIENT_ID_EXISTS: !!process.env.DISCORD_CLIENT_ID,
      DISCORD_CLIENT_SECRET_EXISTS: !!process.env.DISCORD_CLIENT_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not-set',
      NEXTAUTH_URL_IS_HTTPS: process.env.NEXTAUTH_URL?.startsWith('https://') || false,
      timestamp: new Date().toISOString(),
      
      // Production readiness check
      PRODUCTION_READY: process.env.NODE_ENV === 'production' ? 
        !!(process.env.DATABASE_URL && 
           process.env.NEXTAUTH_SECRET && 
           process.env.DISCORD_CLIENT_ID && 
           process.env.DISCORD_CLIENT_SECRET && 
           process.env.NEXTAUTH_URL) : true,
           
      // Warnings
      WARNINGS: [
        ...(process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL ? ['Missing DATABASE_URL'] : []),
        ...(process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET ? ['Missing NEXTAUTH_SECRET'] : []),
        ...(process.env.NODE_ENV === 'production' && !process.env.DISCORD_CLIENT_ID ? ['Missing DISCORD_CLIENT_ID'] : []),
        ...(process.env.NODE_ENV === 'production' && !process.env.DISCORD_CLIENT_SECRET ? ['Missing DISCORD_CLIENT_SECRET'] : []),
        ...(process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_URL ? ['Missing NEXTAUTH_URL'] : []),
        ...(process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32 ? ['NEXTAUTH_SECRET too short (<32 chars)'] : []),
        ...(process.env.NODE_ENV === 'production' && process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.startsWith('https://') ? ['NEXTAUTH_URL should use HTTPS'] : []),
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
