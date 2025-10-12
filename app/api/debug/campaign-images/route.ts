import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Get all campaigns with their featured images
    const campaigns = await prisma.campaign.findMany({
      select: {
        id: true,
        title: true,
        featuredImage: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Log detailed info for debugging
    console.log("📊 All campaigns with images:")
    campaigns.forEach(campaign => {
      console.log(`  ${campaign.id}: "${campaign.title}"`)
      console.log(`    featuredImage: ${campaign.featuredImage || 'NULL'}`)
      console.log(`    status: ${campaign.status}`)
    })

    return NextResponse.json({
      campaigns,
      total: campaigns.length,
      withImages: campaigns.filter(c => c.featuredImage).length,
      withoutImages: campaigns.filter(c => !c.featuredImage).length,
    })
  } catch (error) {
    console.error("Error fetching campaign images:", error)
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
