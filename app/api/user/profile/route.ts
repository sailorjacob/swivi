// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

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

    let dbUser
    try {
      console.log("🔍 Profile API: Querying database for user...")
      dbUser = await prisma.user.findUnique({
        where: { supabaseAuthId: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          bio: true,
          website: true,
          walletAddress: true,
          paypalEmail: true,
          image: true,
          verified: true,
          totalEarnings: true,
          totalViews: true,
          createdAt: true,
          socialAccounts: {
            select: {
              platform: true,
              username: true,
              displayName: true,
              verified: true,
              verifiedAt: true,
            }
          }
        }
      })
      console.log("✅ Profile API: Database query successful, user found:", !!dbUser)
    } catch (dbError) {
      console.error("❌ Profile API: Database query failed:", dbError)
      throw dbError
    }

    if (!dbUser) {
      // User doesn't exist in database, try to create them
      console.log("⚠️ User not found in database, attempting to create...")

      try {
        const oauthName = user.user_metadata?.full_name ||
                         user.user_metadata?.name ||
                         user.user_metadata?.custom_claims?.global_name ||
                         user.raw_user_meta_data?.full_name ||
                         user.raw_user_meta_data?.name ||
                         user.email?.split('@')[0] || 
                         'New User'

        const oauthImage = user.user_metadata?.avatar_url ||
                          user.user_metadata?.picture ||
                          user.raw_user_meta_data?.avatar_url ||
                          user.raw_user_meta_data?.picture

        const newUserData = {
          supabaseAuthId: user.id,
          email: user.email,
          name: oauthName,
          image: oauthImage || null,
          verified: user.email_confirmed_at ? true : false,
          role: 'CLIPPER'
        }

        console.log('🔍 Creating user in profile API with OAuth data:', {
          email: user.email,
          extractedName: oauthName,
          extractedImage: oauthImage
        })

        const newUser = await prisma.user.create({
          data: newUserData,
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
            totalEarnings: true,
            totalViews: true,
            createdAt: true,
            socialAccounts: {
              select: {
                platform: true,
                username: true,
                displayName: true,
                verified: true,
                verifiedAt: true,
              }
            }
          }
        })

        console.log("✅ User created successfully:", newUser.id)
        return NextResponse.json(serializeUser(newUser))
      } catch (createError) {
        console.error("❌ Failed to create user:", createError)
        // Return minimal user data from session if creation fails
        const fallbackName = user.user_metadata?.full_name ||
                             user.user_metadata?.name ||
                             user.user_metadata?.custom_claims?.global_name ||
                             user.raw_user_meta_data?.full_name ||
                             user.raw_user_meta_data?.name ||
                             user.email?.split('@')[0] || 
                             'New User'

        const fallbackImage = user.user_metadata?.avatar_url ||
                             user.user_metadata?.picture ||
                             user.raw_user_meta_data?.avatar_url ||
                             user.raw_user_meta_data?.picture

        return NextResponse.json({
          id: user.id,
          name: fallbackName,
          email: user.email,
          bio: null,
          website: null,
          walletAddress: null,
          paypalEmail: null,
          image: fallbackImage || null,
          verified: user.email_confirmed_at ? true : false,
          totalEarnings: 0,
          totalViews: 0,
          createdAt: new Date().toISOString(),
          socialAccounts: []
        })
      }
    }

    // Convert BigInt fields to strings for JSON serialization
    const serializedUser = serializeUser(dbUser)
    console.log("✅ Profile API: Returning user data with role:", { 
      email: dbUser.email, 
      role: dbUser.role, 
      name: dbUser.name 
    })
    return NextResponse.json(serializedUser)
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
