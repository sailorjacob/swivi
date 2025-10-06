import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole()

    if (!user?.id || error) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const { platform, username, verificationMethod = "auto" } = await request.json()

    if (!platform || !['instagram', 'youtube', 'tiktok', 'twitter'].includes(platform)) {
      return NextResponse.json(
        { error: "Invalid platform" },
        { status: 400 }
      )
    }

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
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
        userId: user.id,
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

    console.log(`🔍 Verification attempt: ${platform}/@${username} with code ${verification.code}`)

    // For Instagram, use alternative verification methods due to heavy anti-bot protection
    if (platform === 'instagram') {
      return await handleInstagramVerification(verification, username, user.id)
    }

    // For other platforms, try normal scraping first, fallback to alternatives
    return await handleStandardVerification(verification, platform, username, user.id)

  } catch (error) {
    console.error("Error in verification:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function handleInstagramVerification(verification: any, username: string, userId: string) {
  // Instagram is heavily protected - offer multiple verification options
  const alternatives = [
    {
      method: "profile_url",
      title: "Submit Profile URL",
      description: "Provide your Instagram profile URL for manual verification",
      action: "Click 'Manual Verification' below"
    },
    {
      method: "screenshot",
      title: "Screenshot Verification", 
      description: "Upload a screenshot of your Instagram bio showing the code",
      action: "Contact support with screenshot"
    },
    {
      method: "dm_verification",
      title: "DM Verification",
      description: "Send a DM from your Instagram account with the verification code",
      action: "DM @swivimedia on Instagram"
    }
  ]

  return NextResponse.json({
    success: false,
    platform: "Instagram",
    username: username,
    message: "Instagram verification requires alternative method due to anti-bot protection",
    verification_code: verification.code,
    alternatives: alternatives,
    instructions: [
      `Add this code to your Instagram bio: ${verification.code}`,
      "Choose one of the verification methods below:",
      "Our team will verify within 24 hours"
    ],
    manual_verification: {
      endpoint: "/api/social-verification/manual-submit",
      contact: "support@swivimedia.com"
    }
  }, { status: 202 }) // 202 = Accepted but needs manual processing
}

async function handleStandardVerification(verification: any, platform: string, username: string, userId: string) {
  // Try automated verification for YouTube, Twitter, TikTok
  let verificationResult = false
  let errorMessage = ""

  try {
    switch (platform) {
      case 'youtube':
        verificationResult = await checkYouTubeBio(username, verification.code)
        break
      case 'twitter':
        verificationResult = await checkTwitterBio(username, verification.code)
        break
      case 'tiktok':
        verificationResult = await checkTikTokBio(username, verification.code)
        break
      default:
        errorMessage = "Platform not supported for automated verification"
    }
  } catch (error) {
    console.error(`${platform} verification failed:`, error)
    errorMessage = `${platform} verification temporarily unavailable`
  }

  if (verificationResult) {
    // Success - mark as verified
    await prisma.socialVerification.update({
      where: { id: verification.id },
      data: { verified: true, verifiedAt: new Date() }
    })

    // Create or update social account
    await createOrUpdateSocialAccount(userId, platform, username)

    return NextResponse.json({
      success: true,
      message: `Successfully verified ${platform} account!`,
      platform: platform,
      username: username
    })
  } else {
    // Failed - offer alternatives
    return NextResponse.json({
      success: false,
      platform: platform,
      username: username,
      message: errorMessage || `Could not find verification code in ${platform} bio`,
      verification_code: verification.code,
      suggestions: [
        "Make sure your profile is public",
        "Add the exact code to your bio",
        "Wait a few minutes and try again",
        "Contact support if the issue persists"
      ],
      manual_verification_available: true
    }, { status: 400 })
  }
}

async function checkYouTubeBio(username: string, code: string): Promise<boolean> {
  // YouTube channel bio checking - more reliable than Instagram
  try {
    const url = `https://www.youtube.com/@${username}/about`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(10000)
    })
    
    if (!response.ok) return false
    
    const html = await response.text()
    return html.toLowerCase().includes(code.toLowerCase())
  } catch (error) {
    console.error("YouTube check failed:", error)
    return false
  }
}

async function checkTwitterBio(username: string, code: string): Promise<boolean> {
  // Twitter/X bio checking
  try {
    const url = `https://x.com/${username}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(10000)
    })
    
    if (!response.ok) return false
    
    const html = await response.text()
    return html.toLowerCase().includes(code.toLowerCase())
  } catch (error) {
    console.error("Twitter check failed:", error)
    return false
  }
}

async function checkTikTokBio(username: string, code: string): Promise<boolean> {
  // TikTok bio checking
  try {
    const url = `https://www.tiktok.com/@${username}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(10000)
    })
    
    if (!response.ok) return false
    
    const html = await response.text()
    return html.toLowerCase().includes(code.toLowerCase())
  } catch (error) {
    console.error("TikTok check failed:", error)
    return false
  }
}

async function createOrUpdateSocialAccount(userId: string, platform: string, username: string) {
  const platformMap: Record<string, string> = {
    instagram: 'INSTAGRAM',
    youtube: 'YOUTUBE',
    tiktok: 'TIKTOK', 
    twitter: 'TWITTER'
  }
  
  const platformEnum = platformMap[platform.toLowerCase()]
  
  const existingAccount = await prisma.socialAccount.findFirst({
    where: {
      userId: userId,
      platform: platformEnum as any,
      username: username
    }
  })

  if (existingAccount && !existingAccount.verified) {
    await prisma.socialAccount.update({
      where: { id: existingAccount.id },
      data: {
        verified: true,
        verifiedAt: new Date()
      }
    })
  } else if (!existingAccount) {
    await prisma.socialAccount.create({
      data: {
        userId: userId,
        platform: platformEnum as any,
        username: username,
        displayName: platform.charAt(0).toUpperCase() + platform.slice(1),
        platformId: `${platform}_${username}_${Date.now()}`,
        verified: true,
        verifiedAt: new Date()
      }
    })
  }
}
