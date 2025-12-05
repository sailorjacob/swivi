// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createBountyApplicationSchema = z.object({
  campaignId: z.string(),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  platform: z.enum(["TIKTOK", "YOUTUBE", "INSTAGRAM", "TWITTER"]),
  profileLink: z.string().url("Valid profile URL is required"),
  tier: z.enum(["TIER_1_HIGH_VOLUME", "TIER_2_QUALITY"]),
  followerCount: z.number().optional(),
  followerScreenshotUrl: z.string().url().optional(),
  clipLinks: z.array(z.string().url()).min(1, "At least one clip link is required"),
  paymentAddress: z.string().min(1, "Payment address is required"),
})

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the internal user ID from the database
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = createBountyApplicationSchema.parse(body)

    // Check if campaign exists and is active
    const campaign = await prisma.campaign.findUnique({
      where: { id: validatedData.campaignId }
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Check for existing application for the same tier
    const existingApplication = await prisma.bountyApplication.findFirst({
      where: {
        userId: dbUser.id,
        campaignId: validatedData.campaignId,
        tier: validatedData.tier
      }
    })

    if (existingApplication) {
      return NextResponse.json({ 
        error: "You have already applied for this bounty tier",
        existingApplicationId: existingApplication.id
      }, { status: 400 })
    }

    // Create the application
    const application = await prisma.bountyApplication.create({
      data: {
        userId: dbUser.id,
        campaignId: validatedData.campaignId,
        fullName: validatedData.fullName,
        email: validatedData.email,
        platform: validatedData.platform,
        profileLink: validatedData.profileLink,
        tier: validatedData.tier,
        followerCount: validatedData.followerCount,
        followerScreenshotUrl: validatedData.followerScreenshotUrl,
        clipLinks: validatedData.clipLinks,
        paymentAddress: validatedData.paymentAddress,
        status: "PENDING"
      }
    })

    // Notify admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true }
    })

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          type: "SYSTEM_UPDATE" as const,
          title: "New Bounty Application",
          message: `${validatedData.fullName} applied for ${validatedData.tier === 'TIER_1_HIGH_VOLUME' ? 'Tier 1 (High Volume)' : 'Tier 2 (Quality)'} bounty on "${campaign.title}"`,
          data: {
            applicationId: application.id,
            campaignId: campaign.id,
            tier: validatedData.tier
          }
        }))
      })
    }

    return NextResponse.json({ 
      success: true,
      application: {
        id: application.id,
        status: application.status,
        tier: application.tier
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }

    console.error("Error creating bounty application:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get("campaignId")

    const applications = await prisma.bountyApplication.findMany({
      where: {
        userId: dbUser.id,
        ...(campaignId ? { campaignId } : {})
      },
      orderBy: { createdAt: "desc" },
      include: {
        campaigns: {
          select: {
            title: true
          }
        }
      }
    })

    return NextResponse.json(applications)

  } catch (error) {
    console.error("Error fetching bounty applications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

