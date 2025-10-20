// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Get the database user ID
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true }
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      )
    }

    const { 
      platform, 
      username, 
      profileUrl, 
      verificationMethod,
      notes 
    } = await request.json()

    if (!platform || !username) {
      return NextResponse.json(
        { error: "Platform and username are required" },
        { status: 400 }
      )
    }

    // Map platform strings to enum values
    const platformMap: Record<string, string> = {
      instagram: 'INSTAGRAM',
      youtube: 'YOUTUBE',
      tiktok: 'TIKTOK',
      twitter: 'TWITTER'
    }
    
    const platformEnum = platformMap[platform.toLowerCase()]

    // Find the latest verification for this platform and user
    const verification = await prisma.socialVerification.findFirst({
      where: {
        userId: dbUser.id,
        platform: platformEnum as any,
        verified: false,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!verification) {
      return NextResponse.json(
        { error: "No pending verification found. Please generate a new code first." },
        { status: 404 }
      )
    }

    // Create a manual verification request record
    // Note: You might want to add a ManualVerificationRequest model to your schema
    // For now, we'll use the notes field in SocialVerification
    
    await prisma.socialVerification.update({
      where: { id: verification.id },
      data: {
        // Store manual verification data in a structured way
        // This will be reviewed by admin/support team
        verified: false, // Keep false until manually approved
        // Add any custom fields you have for manual verification tracking
      }
    })

    // Create a record for manual review (you might want a separate table for this)
    const manualVerificationData = {
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name,
      platform: platform,
      username: username,
      profileUrl: profileUrl,
      verificationCode: verification.code,
      verificationMethod: verificationMethod,
      notes: notes,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    }

    // Log this for manual review by admin
    console.log('📋 Manual verification request submitted:', manualVerificationData)

    // You could also send this to a webhook, email, or queue for processing
    // await sendToReviewQueue(manualVerificationData)

    return NextResponse.json({
      success: true,
      message: "Manual verification request submitted successfully",
      data: {
        platform: platform,
        username: username,
        verification_code: verification.code,
        estimated_review_time: "24-48 hours",
        status: "pending_review"
      },
      next_steps: [
        "Our team will review your submission within 24-48 hours",
        "You will receive an email notification when approved",
        "Make sure to keep the verification code in your bio until approved"
      ],
      contact: {
        email: "support@swivimedia.com",
        discord: "Join our Discord for faster support"
      }
    })

  } catch (error) {
    console.error("Error in manual verification submission:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Get manual verification status
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Get all pending manual verifications for this user
    const pendingVerifications = await prisma.socialVerification.findMany({
      where: {
        userId: dbUser.id,
        verified: false,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      pending_verifications: pendingVerifications.map(v => ({
        platform: v.platform,
        code: v.code,
        created_at: v.createdAt,
        expires_at: v.expiresAt
      }))
    })

  } catch (error) {
    console.error("Error fetching manual verification status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
