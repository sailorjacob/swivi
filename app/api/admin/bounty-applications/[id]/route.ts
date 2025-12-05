// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateApplicationSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  adminNotes: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userData = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id }
    })

    if (!userData || userData.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const application = await prisma.bountyApplication.findUnique({
      where: { id: params.id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            paypalEmail: true,
            bitcoinAddress: true,
            socialAccounts: {
              select: {
                platform: true,
                username: true,
                followers: true,
                verified: true
              }
            }
          }
        },
        campaigns: {
          select: {
            id: true,
            title: true,
            creator: true,
            status: true
          }
        }
      }
    })

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    return NextResponse.json(application)

  } catch (error) {
    console.error("Error fetching bounty application:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userData = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id }
    })

    if (!userData || userData.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateApplicationSchema.parse(body)

    // Check if application exists
    const existingApplication = await prisma.bountyApplication.findUnique({
      where: { id: params.id },
      include: {
        users: { select: { id: true, name: true, email: true } },
        campaigns: { select: { title: true } }
      }
    })

    if (!existingApplication) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    const updateData: any = {
      updatedAt: new Date()
    }

    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
      updateData.reviewedBy = userData.id
      updateData.reviewedAt = new Date()
    }

    if (validatedData.adminNotes !== undefined) {
      updateData.adminNotes = validatedData.adminNotes
    }

    const application = await prisma.bountyApplication.update({
      where: { id: params.id },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        campaigns: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    // Send notification to user about status change
    if (validatedData.status && validatedData.status !== existingApplication.status) {
      const tierName = existingApplication.tier === 'TIER_1_HIGH_VOLUME' 
        ? 'Tier 1 (High Volume)' 
        : 'Tier 2 (Quality)'

      let message = ''
      if (validatedData.status === 'APPROVED') {
        message = `Your ${tierName} bounty application for "${existingApplication.campaigns.title}" has been approved! 🎉`
      } else if (validatedData.status === 'REJECTED') {
        message = `Your ${tierName} bounty application for "${existingApplication.campaigns.title}" was not approved.${validatedData.adminNotes ? ` Notes: ${validatedData.adminNotes}` : ''}`
      }

      if (message) {
        await prisma.notification.create({
          data: {
            userId: existingApplication.users.id,
            type: 'SYSTEM_UPDATE',
            title: validatedData.status === 'APPROVED' ? 'Bounty Application Approved!' : 'Bounty Application Update',
            message,
            data: {
              applicationId: application.id,
              status: validatedData.status,
              tier: existingApplication.tier
            }
          }
        })
      }
    }

    return NextResponse.json(application)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }

    console.error("Error updating bounty application:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userData = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id }
    })

    if (!userData || userData.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    await prisma.bountyApplication.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Application deleted" })

  } catch (error) {
    console.error("Error deleting bounty application:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

