import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  bio: z.string().max(500, "Bio too long").optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
})

const updatePayoutSchema = z.object({
  walletAddress: z.string().max(100, "Wallet address too long").optional().or(z.literal("")),
  paypalEmail: z.string().email("Invalid email").optional().or(z.literal("")),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
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

    // Clean up empty strings
    const cleanedData: any = {}
    for (const [key, value] of Object.entries(validatedData)) {
      if (value === "") {
        cleanedData[key] = null
      } else {
        cleanedData[key] = value
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
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

