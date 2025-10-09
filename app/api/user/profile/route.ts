import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { serializeUser } from "@/lib/bigint-utils"
import { z } from "zod"

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  bio: z.string().max(500, "Bio too long").optional().or(z.literal("")),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
})

const updatePayoutSchema = z.object({
  walletAddress: z.string().max(100, "Wallet address too long").optional().or(z.literal("")),
  paypalEmail: z.string().email("Invalid email").optional().or(z.literal("")),
})

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Profile API: Getting authenticated user...")
    const { user, error } = await getServerUserWithRole(request)

    if (!user || error) {
      console.log("❌ Profile API: No authenticated user or error:", {
        hasUser: !!user,
        userId: user?.id,
        error: error?.message,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: "No authenticated user" }, { status: 401 })
    }

    if (!user.id) {
      console.log("❌ Profile API: User found but no user ID", user)
      return NextResponse.json({ error: "Invalid user - no user ID" }, { status: 401 })
    }
    
    console.log("✅ Profile API: Valid session for user", user.id)

    // TEMPORARY: Skip database query to isolate the issue
    console.log("🔍 Profile API: Returning auth user data directly (bypassing database)")
    
    const fallbackUser = {
      id: user.id,
      name: user.name || 'No name set',
      email: user.email,
      bio: 'Database query temporarily disabled',
      website: null,
      walletAddress: null,
      paypalEmail: null,
      image: user.image || null,
      verified: user.verified || false,
      totalEarnings: 0,
      totalViews: 0,
      createdAt: new Date().toISOString(),
      socialAccounts: []
    }
    
    return NextResponse.json(fallbackUser)
  } catch (error) {
    console.error("❌ Profile GET: Error occurred:", error)
    
    // Handle database connection issues
    if (error.message?.includes('prepared statement') || 
        error.message?.includes('database') || 
        error.message?.includes('connection')) {
      console.log('❌ Profile GET: Database connection issue')
      // Try to reset connection
      try {
        await prisma.$disconnect()
        await prisma.$connect()
        console.log('🔄 Profile GET: Database connection reset')
      } catch (resetError) {
        console.log('❌ Profile GET: Failed to reset connection:', resetError.message)
      }
    }
    
    console.error("❌ Profile GET: Final error:", error.message)
    return NextResponse.json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 Profile PUT: Starting update request')
    const { user, error } = await getServerUserWithRole(request)

    console.log('🔍 Profile PUT: Auth result:', {
      hasUser: !!user,
      userId: user?.id,
      error: error?.message
    })

    if (!user?.id || error) {
      console.log('❌ Profile PUT: Authentication failed')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log('🔍 Profile PUT: Request body:', body)
    const { type, ...data } = body

    let validatedData
    if (type === "profile") {
      console.log('🔍 Profile PUT: Validating profile data:', data)
      validatedData = updateProfileSchema.parse(data)
    } else if (type === "payout") {
      console.log('🔍 Profile PUT: Validating payout data:', data)
      validatedData = updatePayoutSchema.parse(data)
    } else {
      console.log('❌ Profile PUT: Invalid update type:', type)
      return NextResponse.json({ error: "Invalid update type" }, { status: 400 })
    }

    // Clean up empty strings and undefined values
    const cleanedData: any = {}
    for (const [key, value] of Object.entries(validatedData)) {
      if (value === "" || value === undefined) {
        cleanedData[key] = null
      } else {
        cleanedData[key] = value
      }
    }

    console.log('🔍 Profile PUT: Cleaned data for update:', cleanedData)
    console.log('🔍 Profile PUT: Updating user with supabaseAuthId:', user.id)

    let updatedUser
    try {
      updatedUser = await prisma.user.update({
        where: { supabaseAuthId: user.id },
        data: cleanedData,
        select: {
          id: true,
          name: true,
          email: true,
          bio: true,
          website: true,
          walletAddress: true,
          paypalEmail: true,
          image: true,
          verified: true,
          updatedAt: true,
        }
      })
      console.log('✅ Profile PUT: Database update successful')
    } catch (updateError) {
      console.error('❌ Profile PUT: Database update failed:', updateError)
      throw updateError
    }

    console.log('✅ Profile PUT: Update successful:', updatedUser.id)
    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("❌ Profile PUT: Error occurred:", error)
    
    if (error instanceof z.ZodError) {
      console.log('❌ Profile PUT: Validation error:', error.errors)
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    
    // Handle database connection issues
    if (error.message?.includes('prepared statement') || 
        error.message?.includes('database') || 
        error.message?.includes('connection')) {
      console.log('❌ Profile PUT: Database connection issue')
      // Try to reset connection
      try {
        await prisma.$disconnect()
        await prisma.$connect()
        console.log('🔄 Profile PUT: Database connection reset')
      } catch (resetError) {
        console.log('❌ Profile PUT: Failed to reset connection:', resetError.message)
      }
    }
    
    console.error("❌ Profile PUT: Final error:", error.message)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 })
  }
}

