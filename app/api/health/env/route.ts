import { NextResponse } from "next/server"

export async function GET() {
  try {
    const envStatus = {
      NODE_ENV: process.env.NODE_ENV || 'not-set',
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      DATABASE_URL_TYPE: process.env.DATABASE_URL?.includes('pooler.supabase.com') ? 'supabase-pooler' : 'other',
      NEXTAUTH_SECRET_EXISTS: !!process.env.NEXTAUTH_SECRET,
      DISCORD_CLIENT_ID_EXISTS: !!process.env.DISCORD_CLIENT_ID,
      DISCORD_CLIENT_SECRET_EXISTS: !!process.env.DISCORD_CLIENT_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not-set',
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(envStatus)
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check environment',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
