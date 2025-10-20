// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { convertBigIntToString } from "@/lib/bigint-utils"

export async function GET(request: NextRequest) {
  console.log("🧪 DEBUG: Test schema structure")
  
  try {
    // Test 1: Get a simple submission without relations
    console.log("🧪 Step 1: Simple submission query...")
    const simpleSubmission = await prisma.clipSubmission.findFirst({
      select: {
        id: true,
        clipUrl: true,
        platform: true,
        status: true,
        userId: true,
        campaignId: true,
        clipId: true
      }
    })
    
    if (!simpleSubmission) {
      return NextResponse.json({
        error: "No submissions found in database",
        success: false
      })
    }

    console.log("🧪 Simple submission:", simpleSubmission)

    // Test 2: Test user relation (should be 'users' based on schema)
    console.log("🧪 Step 2: Testing user relation...")
    let userRelationTest
    try {
      userRelationTest = await prisma.clipSubmission.findFirst({
        where: { id: simpleSubmission.id },
        select: {
          id: true,
          users: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })
      console.log("🧪 User relation works:", !!userRelationTest?.users)
    } catch (error) {
      console.log("🧪 User relation failed:", error.message)
      userRelationTest = { error: error.message }
    }

    // Test 3: Test campaign relation (should be 'campaigns' based on schema)
    console.log("🧪 Step 3: Testing campaign relation...")
    let campaignRelationTest
    try {
      campaignRelationTest = await prisma.clipSubmission.findFirst({
        where: { id: simpleSubmission.id },
        select: {
          id: true,
          campaigns: {
            select: {
              id: true,
              title: true,
              creator: true,
              payoutRate: true
            }
          }
        }
      })
      console.log("🧪 Campaign relation works:", !!campaignRelationTest?.campaigns)
    } catch (error) {
      console.log("🧪 Campaign relation failed:", error.message)
      campaignRelationTest = { error: error.message }
    }

    // Test 4: Test clip relation (should be 'clips' based on schema)
    console.log("🧪 Step 4: Testing clip relation...")
    let clipRelationTest
    try {
      clipRelationTest = await prisma.clipSubmission.findFirst({
        where: { id: simpleSubmission.id },
        select: {
          id: true,
          clips: {
            select: {
              id: true,
              title: true,
              views: true,
              earnings: true
            }
          }
        }
      })
      console.log("🧪 Clip relation works:", !!clipRelationTest?.clips)
    } catch (error) {
      console.log("🧪 Clip relation failed:", error.message)
      clipRelationTest = { error: error.message }
    }

    // Test 5: Test view_tracking nested relation
    console.log("🧪 Step 5: Testing view_tracking nested relation...")
    let viewTrackingTest
    try {
      viewTrackingTest = await prisma.clipSubmission.findFirst({
        where: { id: simpleSubmission.id },
        select: {
          id: true,
          clips: {
            select: {
              id: true,
              view_tracking: {
                select: {
                  views: true,
                  date: true
                },
                orderBy: { date: "desc" },
                take: 2
              }
            }
          }
        }
      })
      console.log("🧪 View tracking works:", !!viewTrackingTest?.clips?.view_tracking)
    } catch (error) {
      console.log("🧪 View tracking failed:", error.message)
      viewTrackingTest = { error: error.message }
    }

    // Test 6: Test the exact query from admin API
    console.log("🧪 Step 6: Testing exact admin API query...")
    let exactApiTest
    try {
      exactApiTest = await prisma.clipSubmission.findFirst({
        where: { id: simpleSubmission.id },
        select: {
          id: true,
          clipUrl: true,
          platform: true,
          status: true,
          payout: true,
          paidAt: true,
          createdAt: true,
          rejectionReason: true,
          requiresReview: true,
          reviewReason: true,
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              totalViews: true,
              totalEarnings: true
            }
          },
          clips: {
            select: {
              id: true,
              title: true,
              views: true,
              earnings: true,
              view_tracking: {
                orderBy: { date: "desc" },
                take: 2
              }
            }
          },
          campaigns: {
            select: {
              id: true,
              title: true,
              creator: true,
              payoutRate: true
            }
          }
        }
      })
      console.log("🧪 Exact API query works!")
    } catch (error) {
      console.log("🧪 Exact API query failed:", error.message)
      exactApiTest = { error: error.message }
    }

    return NextResponse.json({
      success: true,
      tests: {
        simple_submission: convertBigIntToString(simpleSubmission),
        user_relation: convertBigIntToString(userRelationTest),
        campaign_relation: convertBigIntToString(campaignRelationTest),
        clip_relation: convertBigIntToString(clipRelationTest),
        view_tracking: convertBigIntToString(viewTrackingTest),
        exact_api_query: convertBigIntToString(exactApiTest)
      }
    })

  } catch (error) {
    console.error("🧪 ❌ Schema test failed:", error)
    return NextResponse.json({ 
      success: false,
      error: error.message
    })
  }
}
