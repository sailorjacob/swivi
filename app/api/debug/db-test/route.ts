import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DB Test: Starting...')
    
    const { user, error } = await getServerUserWithRole(request)
    
    if (!user || error) {
      return NextResponse.json({ 
        success: false, 
        error: "Authentication failed" 
      }, { status: 401 })
    }

    console.log('✅ DB Test: Auth success, testing database...')
    
    // Test 1: Simple user count
    try {
      const userCount = await prisma.user.count()
      console.log('✅ DB Test: User count query successful:', userCount)
    } catch (countError) {
      console.error('❌ DB Test: User count failed:', countError)
      return NextResponse.json({
        success: false,
        error: "Database connection failed",
        details: countError.message,
        test: "user count"
      })
    }

    // Test 2: Find current user
    try {
      const currentUser = await prisma.user.findUnique({
        where: { supabaseAuthId: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          bio: true
        }
      })
      console.log('✅ DB Test: User query successful:', !!currentUser)
      
      return NextResponse.json({
        success: true,
        userCount,
        currentUser: currentUser ? {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          bio: currentUser.bio
        } : null,
        timestamp: new Date().toISOString()
      })
    } catch (userError) {
      console.error('❌ DB Test: User query failed:', userError)
      return NextResponse.json({
        success: false,
        error: "User query failed",
        details: userError.message,
        test: "user query"
      })
    }

  } catch (error) {
    console.error('❌ DB Test: General error:', error)
    return NextResponse.json({ 
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}