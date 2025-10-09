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

    const { platform, username } = await request.json()

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

    console.log(`🔍 API verification attempt: ${platform}/@${username} with code ${verification.code}`)

    // Call the appropriate API verification function
    let verificationResult = false
    let errorMessage = ""

    try {
      switch (platform) {
        case 'twitter':
          verificationResult = await verifyTwitterWithAPI(username, verification.code)
          break
        case 'youtube':
          verificationResult = await verifyYouTubeWithAPI(username, verification.code)
          break
        case 'instagram':
          verificationResult = await verifyInstagramWithAPI(username, verification.code)
          break
        case 'tiktok':
          verificationResult = await verifyTikTokWithAPI(username, verification.code)
          break
        default:
          errorMessage = "Platform not supported for API verification"
      }
    } catch (error) {
      console.error(`${platform} API verification failed:`, error)
      errorMessage = error instanceof Error ? error.message : `${platform} API verification failed`
    }

    if (verificationResult) {
      // Success - mark as verified
      await prisma.socialVerification.update({
        where: { id: verification.id },
        data: { verified: true, verifiedAt: new Date() }
      })

      // Create or update social account
      await createOrUpdateSocialAccount(user.id, platform, username)

      return NextResponse.json({
        success: true,
        message: `Successfully verified ${platform} account using official API!`,
        platform: platform,
        username: username,
        method: "official_api"
      })
    } else {
      return NextResponse.json({
        success: false,
        platform: platform,
        username: username,
        message: errorMessage || `Could not verify ${platform} account via API`,
        verification_code: verification.code,
        suggestions: [
          "Make sure your profile is public",
          "Add the exact code to your bio",
          "Wait a few minutes for API sync",
          "Check that your username is correct"
        ]
      }, { status: 400 })
    }

  } catch (error) {
    console.error("Error in API verification:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Twitter API verification using Bearer Token
 */
async function verifyTwitterWithAPI(username: string, code: string): Promise<boolean> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN
  
  if (!bearerToken) {
    console.log("❌ Twitter Bearer Token not configured")
    throw new Error("Twitter API not configured. Add TWITTER_BEARER_TOKEN to environment variables.")
  }

  try {
    console.log(`🐦 Verifying Twitter @${username} via API`)
    
    // Get user by username
    const userResponse = await fetch(`https://api.twitter.com/2/users/by/username/${username}?user.fields=description`, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'User-Agent': 'Swivi/1.0'
      }
    })

    if (!userResponse.ok) {
      if (userResponse.status === 404) {
        throw new Error("Twitter user not found")
      }
      throw new Error(`Twitter API error: ${userResponse.status}`)
    }

    const userData = await userResponse.json()
    const description = userData.data?.description || ""

    console.log(`📝 Twitter bio: "${description}"`)
    
    // Check if code is in bio
    const codeFound = description.toLowerCase().includes(code.toLowerCase())
    console.log(`🔍 Code "${code}" ${codeFound ? 'FOUND' : 'NOT FOUND'} in bio`)
    
    return codeFound

  } catch (error) {
    console.error("Twitter API verification failed:", error)
    throw error
  }
}

/**
 * YouTube API verification using API Key
 */
async function verifyYouTubeWithAPI(username: string, code: string): Promise<boolean> {
  const apiKey = process.env.YOUTUBE_API_KEY
  
  if (!apiKey) {
    console.log("❌ YouTube API Key not configured")
    throw new Error("YouTube API not configured. Add YOUTUBE_API_KEY to environment variables.")
  }

  try {
    console.log(`📺 Verifying YouTube @${username} via API`)
    
    // Search for channel by custom URL/handle
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${username}&key=${apiKey}`
    )

    if (!searchResponse.ok) {
      throw new Error(`YouTube API error: ${searchResponse.status}`)
    }

    const searchData = await searchResponse.json()
    
    if (!searchData.items || searchData.items.length === 0) {
      throw new Error("YouTube channel not found")
    }

    const channelId = searchData.items[0].id.channelId
    
    // Get channel details including description
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`
    )

    if (!channelResponse.ok) {
      throw new Error(`YouTube channel API error: ${channelResponse.status}`)
    }

    const channelData = await channelResponse.json()
    const description = channelData.items[0]?.snippet?.description || ""

    console.log(`📝 YouTube description: "${description.substring(0, 200)}..."`)
    
    // Check if code is in description
    const codeFound = description.toLowerCase().includes(code.toLowerCase())
    console.log(`🔍 Code "${code}" ${codeFound ? 'FOUND' : 'NOT FOUND'} in description`)
    
    return codeFound

  } catch (error) {
    console.error("YouTube API verification failed:", error)
    throw error
  }
}

/**
 * Instagram Basic Display API verification
 */
async function verifyInstagramWithAPI(username: string, code: string): Promise<boolean> {
  // Instagram Basic Display API requires user consent and access tokens
  // For bio verification, we'd need Instagram Business API which requires app review
  console.log("❌ Instagram API verification requires Business API approval")
  throw new Error("Instagram API verification requires Meta Business API approval. Use manual verification for now.")
}

/**
 * TikTok API verification (if available)
 */
async function verifyTikTokWithAPI(username: string, code: string): Promise<boolean> {
  // TikTok API is very restrictive and doesn't easily allow bio access
  console.log("❌ TikTok API verification not available for bio content")
  throw new Error("TikTok API doesn't provide bio access. Use manual verification.")
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
