import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Testing database connectivity...")

    // Test basic database connection
    await prisma.$connect()

    // Test user count
    const userCount = await prisma.user.count()

    // Test campaign count
    const campaignCount = await prisma.campaign.count()

    // Test clip submission count
    const submissionCount = await prisma.clipSubmission.count()

    // Test recent users
    const recentUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        supabaseAuthId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    })

    // Test recent campaigns
    const recentCampaigns = await prisma.campaign.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        budget: true,
        createdAt: true,
        _count: {
          select: {
            clipSubmissions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    })

    await prisma.$disconnect()

    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        userCount,
        campaignCount,
        submissionCount
      },
      recentUsers: recentUsers.map(user => ({
        id: user.id,
        name: user.name || 'No name',
        email: user.email,
        hasSupabaseAuthId: !!user.supabaseAuthId,
        createdAt: user.createdAt
      })),
      recentCampaigns: recentCampaigns.map(campaign => ({
        id: campaign.id,
        title: campaign.title,
        status: campaign.status,
        budget: campaign.budget.toString(),
        submissions: campaign._count.clipSubmissions,
        createdAt: campaign.createdAt
      }))
    })

  } catch (error) {
    console.error("❌ Database test failed:", error)

    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
