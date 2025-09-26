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
  let browser: any = null
  
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

    // Import Puppeteer dynamically
    const puppeteer = require('puppeteer')
    
    // Launch browser
    logs.push("🚀 Launching browser...")
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    })

    const page = await browser.newPage()
    
    // Set realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36')
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 720 })

    logs.push("🔐 Logging into Twitter...")
    
    // Navigate to Twitter login
    await page.goto('https://x.com/i/flow/login', { waitUntil: 'networkidle2' })
    
    // Wait for login form and fill email
    await page.waitForSelector('input[name="text"]', { timeout: 10000 })
    await page.type('input[name="text"]', twitterEmail, { delay: 100 })
    
    // Click Next button
    await page.click('[role="button"]:has-text("Next")')
    
    // Wait for password field and fill it
    await page.waitForSelector('input[name="password"]', { timeout: 10000 })
    await page.type('input[name="password"]', twitterPassword, { delay: 100 })
    
    // Click Login button
    await page.click('[data-testid="LoginForm_Login_Button"]')
    
    // Wait for login to complete (check for home timeline or profile)
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 })
    
    logs.push("✅ Successfully logged into Twitter")
    logs.push(`📍 Navigating to @${username} profile...`)
    
    // Navigate to target user's profile
    await page.goto(`https://x.com/${username}`, { waitUntil: 'networkidle2' })
    
    // Wait for profile to load
    await page.waitForTimeout(3000)
    
    // Extract bio content - try multiple selectors
    let bio = ''
    const bioSelectors = [
      '[data-testid="UserDescription"]',
      '[data-testid="UserBio"]', 
      '.css-1dbjc4n.r-1s2bzr4 > .css-901oao',
      '.ProfileHeaderCard-bio',
      '.ProfileCard-content .u-dir'
    ]
    
    for (const selector of bioSelectors) {
      try {
        const bioElement = await page.$(selector)
        if (bioElement) {
          bio = await page.evaluate((el: any) => el.textContent || '', bioElement)
          if (bio && bio.trim()) {
            logs.push(`📝 Found bio using selector: ${selector}`)
            break
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!bio || !bio.trim()) {
      logs.push("❌ Could not extract bio content")
      return {
        success: false,
        error: "Could not find or extract bio content from Twitter profile",
        logs: logs
      }
    }
    
    logs.push(`📄 Bio extracted: "${bio.substring(0, 100)}${bio.length > 100 ? '...' : ''}"`)
    
    // Check if verification code is in bio
    const codeFound = bio.toLowerCase().includes(code.toLowerCase())
    logs.push(`🔍 Code search result: ${codeFound ? '✅ FOUND' : '❌ NOT FOUND'}`)
    
    if (codeFound) {
      logs.push(`🎉 Verification code "${code}" found in @${username}'s bio!`)
    } else {
      logs.push(`📝 Bio content: "${bio}"`)
      logs.push(`🔑 Expected code: "${code}"`)
    }
    
    return {
      success: codeFound,
      error: codeFound ? undefined : `Verification code "${code}" not found in bio`,
      logs: logs,
      bio: bio
    }

  } catch (error) {
    logs.push(`❌ Agent error: ${error instanceof Error ? error.message : String(error)}`)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Twitter agent verification failed",
      logs: logs
    }
  } finally {
    if (browser) {
      await browser.close()
      logs.push("🔒 Browser closed")
    }
  }
}

/**
 * Instagram verification using browser agent
 */
async function verifyInstagramWithAgent(username: string, code: string): Promise<AgentResult> {
  const logs: string[] = []
  let browser: any = null
  
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

    // Import Puppeteer dynamically
    const puppeteer = require('puppeteer')
    
    // Launch browser
    logs.push("🚀 Launching browser...")
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    })

    const page = await browser.newPage()
    
    // Set realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36')
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 720 })

    logs.push("🔐 Logging into Instagram...")
    
    // Navigate to Instagram login
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2' })
    
    // Wait for login form
    await page.waitForSelector('input[name="username"]', { timeout: 10000 })
    
    // Fill username
    await page.type('input[name="username"]', instagramEmail, { delay: 100 })
    
    // Fill password
    await page.type('input[name="password"]', instagramPassword, { delay: 100 })
    
    // Click login button
    await page.click('button[type="submit"]')
    
    // Wait for login to complete
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 })
    
    // Handle potential "Save Info" dialog
    try {
      await page.waitForTimeout(2000)
      const notNowButton = await page.$('button:has-text("Not Now")')
      if (notNowButton) {
        await notNowButton.click()
        logs.push("✅ Dismissed save info dialog")
      }
    } catch (e) {
      // Continue if no dialog appears
    }
    
    logs.push("✅ Successfully logged into Instagram")
    logs.push(`📍 Navigating to @${username} profile...`)
    
    // Navigate to target user's profile
    await page.goto(`https://www.instagram.com/${username}/`, { waitUntil: 'networkidle2' })
    
    // Wait for profile to load
    await page.waitForTimeout(3000)
    
    // Extract bio content - try multiple selectors
    let bio = ''
    const bioSelectors = [
      '.-vDIg span',
      '.C7I1f',
      '._aa_c ._aacl._aaco._aacw._aacx._aad7._aade',
      'article header section div div span',
      '[data-testid="bio"]'
    ]
    
    for (const selector of bioSelectors) {
      try {
        const bioElement = await page.$(selector)
        if (bioElement) {
          bio = await page.evaluate((el: any) => el.textContent || '', bioElement)
          if (bio && bio.trim()) {
            logs.push(`📝 Found bio using selector: ${selector}`)
            break
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!bio || !bio.trim()) {
      logs.push("❌ Could not extract bio content")
      return {
        success: false,
        error: "Could not find or extract bio content from Instagram profile",
        logs: logs
      }
    }
    
    logs.push(`📄 Bio extracted: "${bio.substring(0, 100)}${bio.length > 100 ? '...' : ''}"`)
    
    // Check if verification code is in bio
    const codeFound = bio.toLowerCase().includes(code.toLowerCase())
    logs.push(`🔍 Code search result: ${codeFound ? '✅ FOUND' : '❌ NOT FOUND'}`)
    
    if (codeFound) {
      logs.push(`🎉 Verification code "${code}" found in @${username}'s bio!`)
    } else {
      logs.push(`📝 Bio content: "${bio}"`)
      logs.push(`🔑 Expected code: "${code}"`)
    }
    
    return {
      success: codeFound,
      error: codeFound ? undefined : `Verification code "${code}" not found in bio`,
      logs: logs,
      bio: bio
    }

  } catch (error) {
    logs.push(`❌ Agent error: ${error instanceof Error ? error.message : String(error)}`)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Instagram agent verification failed",
      logs: logs
    }
  } finally {
    if (browser) {
      await browser.close()
      logs.push("🔒 Browser closed")
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
