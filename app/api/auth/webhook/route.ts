import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

// Webhook endpoint for Supabase Auth events
// This creates users in our database when they authenticate via OAuth
export async function POST(request: NextRequest) {
  try {
    // Verify the webhook is from Supabase (you should add proper verification)
    const headersList = headers()
    const authorization = headersList.get('authorization')

    // In production, you should verify this is actually from Supabase
    // For now, we'll accept all requests but log them
    console.log('🔗 Auth webhook received:', {
      timestamp: new Date().toISOString(),
      hasAuth: !!authorization,
      userAgent: headersList.get('user-agent')
    })

    const body = await request.json()
    const { type, table, record, old_record } = body

    console.log('🔍 Webhook event:', { type, table, record: record ? 'present' : 'missing' })

    // Handle user creation/update events from Supabase Auth
    if (type === 'INSERT' && table === 'users' && record) {
      // This is a new user from Supabase Auth
      const supabaseUser = record

      // Check if user already exists in our database
      const existingUser = await prisma.user.findUnique({
        where: { supabaseAuthId: supabaseUser.id }
      })

      if (existingUser) {
        console.log('✅ User already exists in database:', existingUser.id)
        return NextResponse.json({ success: true, message: 'User already exists' })
      }

      // Extract user data from Supabase Auth user object
      const userData = {
        supabaseAuthId: supabaseUser.id,
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.full_name ||
              supabaseUser.user_metadata?.name ||
              supabaseUser.raw_user_meta_data?.full_name ||
              supabaseUser.raw_user_meta_data?.name,
        image: supabaseUser.user_metadata?.avatar_url ||
               supabaseUser.user_metadata?.picture ||
               supabaseUser.raw_user_meta_data?.avatar_url ||
               supabaseUser.raw_user_meta_data?.picture,
        verified: supabaseUser.email_confirmed_at ? true : false,
        role: 'CLIPPER' // Default role for new users
      }

      console.log('📝 Creating new user:', userData)

      // Create user in our database
      const newUser = await prisma.user.create({
        data: userData
      })

      console.log('✅ Created new user:', newUser.id)
      return NextResponse.json({
        success: true,
        message: 'User created successfully',
        userId: newUser.id
      })
    }

    // Handle user update events
    if (type === 'UPDATE' && table === 'users' && record) {
      const supabaseUser = record

      // Update existing user with new information
      const updatedUser = await prisma.user.updateMany({
        where: { supabaseAuthId: supabaseUser.id },
        data: {
          email: supabaseUser.email,
          name: supabaseUser.user_metadata?.full_name ||
                supabaseUser.user_metadata?.name ||
                supabaseUser.raw_user_meta_data?.full_name ||
                supabaseUser.raw_user_meta_data?.name,
          image: supabaseUser.user_metadata?.avatar_url ||
                 supabaseUser.user_metadata?.picture ||
                 supabaseUser.raw_user_meta_data?.avatar_url ||
                 supabaseUser.raw_user_meta_data?.picture,
          verified: supabaseUser.email_confirmed_at ? true : false
        }
      })

      console.log('✅ Updated user:', updatedUser.count, 'records')
      return NextResponse.json({
        success: true,
        message: 'User updated successfully',
        updatedCount: updatedUser.count
      })
    }

    // For other event types, just acknowledge
    return NextResponse.json({ success: true, message: 'Event acknowledged' })

  } catch (error) {
    console.error('❌ Auth webhook error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Handle webhook verification (GET request for initial setup)
export async function GET() {
  return NextResponse.json({
    message: 'Auth webhook endpoint ready',
    supportedEvents: ['INSERT', 'UPDATE'],
    supportedTables: ['users'],
    timestamp: new Date().toISOString()
  })
}
