import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
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
        userId: session.user.id,
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

    console.log(`🤖 Agent verification attempt: ${platform}/@${username} with code ${verification.code}`)

    // Call the appropriate agent verification function
    let verificationResult = false
    let errorMessage = ""
    let agentLogs: string[] = []

    try {
      switch (platform) {
        case 'twitter':
          const twitterResult = await verifyTwitterWithAgent(username, verification.code)
          verificationResult = twitterResult.success
          errorMessage = twitterResult.error || ""
          agentLogs = twitterResult.logs || []
          break
        case 'instagram':
          const instagramResult = await verifyInstagramWithAgent(username, verification.code)
          verificationResult = instagramResult.success
          errorMessage = instagramResult.error || ""
          agentLogs = instagramResult.logs || []
          break
        case 'youtube':
          const youtubeResult = await verifyYouTubeWithAgent(username, verification.code)
          verificationResult = youtubeResult.success
          errorMessage = youtubeResult.error || ""
          agentLogs = youtubeResult.logs || []
          break
        case 'tiktok':
          const tiktokResult = await verifyTikTokWithAgent(username, verification.code)
          verificationResult = tiktokResult.success
          errorMessage = tiktokResult.error || ""
          agentLogs = tiktokResult.logs || []
          break
        default:
          errorMessage = "Platform not supported for agent verification"
      }
    } catch (error) {
      console.error(`${platform} agent verification failed:`, error)
      errorMessage = error instanceof Error ? error.message : `${platform} agent verification failed`
    }

    if (verificationResult) {
      // Success - mark as verified
      await prisma.socialVerification.update({
        where: { id: verification.id },
        data: { verified: true, verifiedAt: new Date() }
      })

      // Create or update social account
      await createOrUpdateSocialAccount(session.user.id, platform, username)

      return NextResponse.json({
        success: true,
        message: `Successfully verified ${platform} account using browser agent!`,
        platform: platform,
        username: username,
        method: "browser_agent",
        agent_logs: agentLogs
      })
    } else {
      return NextResponse.json({
        success: false,
        platform: platform,
        username: username,
        message: errorMessage || `Could not verify ${platform} account via agent`,
        verification_code: verification.code,
        agent_logs: agentLogs,
        suggestions: [
          "Make sure your profile is public",
          "Add the exact code to your bio",
          "Wait a few minutes after updating bio",
          "Check that your username is correct"
        ]
      }, { status: 400 })
    }

  } catch (error) {
    console.error("Error in agent verification:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

interface AgentResult {
  success: boolean
  error?: string
  logs: string[]
  bio?: string
}

/**
 * Twitter verification using browser agent
 */
async function verifyTwitterWithAgent(username: string, code: string): Promise<AgentResult> {
  const logs: string[] = []
  
  try {
    // Check if required environment variables are set
    const twitterEmail = process.env.TWITTER_AGENT_EMAIL
    const twitterPassword = process.env.TWITTER_AGENT_PASSWORD
    
    if (!twitterEmail || !twitterPassword) {
      return {
        success: false,
        error: "Twitter agent credentials not configured. Add TWITTER_AGENT_EMAIL and TWITTER_AGENT_PASSWORD to environment variables.",
        logs: ["❌ Agent credentials missing"]
      }
    }

    logs.push("🤖 Starting Twitter browser agent...")
    logs.push(`🔍 Target: @${username}`)
    logs.push(`🔑 Looking for code: ${code}`)

    // Here you would use Puppeteer/Playwright to:
    // 1. Launch browser
    // 2. Login to Twitter with your credentials
    // 3. Navigate to the user's profile
    // 4. Extract bio content
    // 5. Check for verification code

    // For now, return a placeholder result
    logs.push("🚧 Browser agent implementation coming soon...")
    logs.push("📝 Would navigate to: https://x.com/" + username)
    logs.push("🔐 Would login with configured credentials")
    logs.push("📄 Would extract bio and search for code")

    return {
      success: false,
      error: "Browser agent implementation in progress. Use API or manual verification for now.",
      logs: logs
    }

  } catch (error) {
    logs.push(`❌ Agent error: ${error instanceof Error ? error.message : String(error)}`)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown agent error",
      logs: logs
    }
  }
}

/**
 * Instagram verification using browser agent
 */
async function verifyInstagramWithAgent(username: string, code: string): Promise<AgentResult> {
  const logs: string[] = []
  
  try {
    const instagramEmail = process.env.INSTAGRAM_AGENT_EMAIL
    const instagramPassword = process.env.INSTAGRAM_AGENT_PASSWORD
    
    if (!instagramEmail || !instagramPassword) {
      return {
        success: false,
        error: "Instagram agent credentials not configured. Add INSTAGRAM_AGENT_EMAIL and INSTAGRAM_AGENT_PASSWORD to environment variables.",
        logs: ["❌ Agent credentials missing"]
      }
    }

    logs.push("🤖 Starting Instagram browser agent...")
    logs.push(`🔍 Target: @${username}`)
    logs.push(`🔑 Looking for code: ${code}`)

    // Browser agent implementation would go here
    logs.push("🚧 Browser agent implementation coming soon...")
    logs.push("📝 Would navigate to: https://instagram.com/" + username)
    logs.push("🔐 Would login with configured credentials")
    logs.push("📄 Would extract bio and search for code")

    return {
      success: false,
      error: "Browser agent implementation in progress. Use manual verification for now.",
      logs: logs
    }

  } catch (error) {
    logs.push(`❌ Agent error: ${error instanceof Error ? error.message : String(error)}`)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown agent error",
      logs: logs
    }
  }
}

/**
 * YouTube verification using browser agent
 */
async function verifyYouTubeWithAgent(username: string, code: string): Promise<AgentResult> {
  const logs: string[] = []
  
  try {
    logs.push("🤖 Starting YouTube browser agent...")
    logs.push(`🔍 Target: @${username}`)
    logs.push(`🔑 Looking for code: ${code}`)

    // YouTube might not need login for public channel descriptions
    logs.push("🚧 Browser agent implementation coming soon...")
    logs.push("📝 Would navigate to: https://youtube.com/@" + username + "/about")
    logs.push("📄 Would extract channel description and search for code")

    return {
      success: false,
      error: "Browser agent implementation in progress. Use API verification for YouTube.",
      logs: logs
    }

  } catch (error) {
    logs.push(`❌ Agent error: ${error instanceof Error ? error.message : String(error)}`)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown agent error",
      logs: logs
    }
  }
}

/**
 * TikTok verification using browser agent
 */
async function verifyTikTokWithAgent(username: string, code: string): Promise<AgentResult> {
  const logs: string[] = []
  
  try {
    logs.push("🤖 Starting TikTok browser agent...")
    logs.push(`🔍 Target: @${username}`)
    logs.push(`🔑 Looking for code: ${code}`)

    logs.push("🚧 Browser agent implementation coming soon...")
    logs.push("📝 Would navigate to: https://tiktok.com/@" + username)
    logs.push("📄 Would extract bio and search for code")

    return {
      success: false,
      error: "Browser agent implementation in progress. Use manual verification for now.",
      logs: logs
    }

  } catch (error) {
    logs.push(`❌ Agent error: ${error instanceof Error ? error.message : String(error)}`)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown agent error",
      logs: logs
    }
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
