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
      console.log("❌ Profile API: No authenticated user or error:", error?.message)
      return NextResponse.json({ error: "No authenticated user" }, { status: 401 })
    }

    if (!user.id) {
      console.log("❌ Profile API: User found but no user ID", user)
      return NextResponse.json({ error: "Invalid user - no user ID" }, { status: 401 })
    }
    
    console.log("✅ Profile API: Valid session for user", user.id)

    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
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
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
          }
        }
      }
    })

    if (!dbUser) {
      // User doesn't exist in database, try to create them
      console.log("⚠️ User not found in database, attempting to create...")

      try {
        // Try to create the user in our database
        const newUserData = {
          supabaseAuthId: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'New User',
          image: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          verified: user.email_confirmed_at ? true : false,
          role: 'CLIPPER'
        }

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
            accounts: {
              select: {
                provider: true,
                providerAccountId: true,
              }
            }
          }
        })

        console.log("✅ User created successfully:", newUser.id)
        return NextResponse.json(newUser)
      } catch (createError) {
        console.error("❌ Failed to create user:", createError)
        // Return minimal user data from session if creation fails
        return NextResponse.json({
          id: user.id,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'New User',
          email: user.email,
          bio: null,
          website: null,
          walletAddress: null,
          paypalEmail: null,
          image: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          verified: user.email_confirmed_at ? true : false,
          totalEarnings: 0,
          totalViews: 0,
          createdAt: new Date().toISOString(),
          accounts: []
        })
      }
    }

    // Convert BigInt fields to strings for JSON serialization
    const serializedUser = serializeUser(dbUser)

    return NextResponse.json(serializedUser)
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, ...data } = body

    let validatedData
    if (type === "profile") {
      validatedData = updateProfileSchema.parse(data)
    } else if (type === "payout") {
      validatedData = updatePayoutSchema.parse(data)
    } else {
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

    const updatedUser = await prisma.user.update({
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

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    
    console.error("Error updating user profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

