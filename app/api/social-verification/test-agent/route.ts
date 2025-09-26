import { NextRequest, NextResponse } from "next/server"
import { launchBrowser } from "@/lib/puppeteer-config"

interface AgentResult {
  success: boolean
  error?: string
  logs: string[]
  bio?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform') || 'twitter'
    const username = searchParams.get('username') || 'elonmusk'
    const code = searchParams.get('code') || 'TEST123'

    console.log(`🧪 Testing agent for ${platform}/@${username} with code "${code}"`)

    let result: AgentResult
    
    if (platform === 'twitter') {
      result = await testTwitterAgent(username, code)
    } else if (platform === 'instagram') {
      result = await testInstagramAgent(username, code)
    } else {
      return NextResponse.json({
        error: "Only twitter and instagram supported for testing",
        available_platforms: ["twitter", "instagram"]
      }, { status: 400 })
    }

    return NextResponse.json({
      platform: platform,
      username: username,
      code_searched: code,
      result: result,
      test_mode: true
    })

  } catch (error) {
    console.error("Test agent failed:", error)
    return NextResponse.json({
      error: "Test failed",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

async function testTwitterAgent(username: string, code: string): Promise<AgentResult> {
  const logs: string[] = []
  let browser: any = null
  
  try {
    const twitterEmail = process.env.TWITTER_AGENT_EMAIL
    const twitterPassword = process.env.TWITTER_AGENT_PASSWORD
    
    if (!twitterEmail || !twitterPassword) {
      return {
        success: false,
        error: "Twitter agent credentials not configured",
        logs: ["❌ Agent credentials missing"]
      }
    }

    logs.push("🤖 Starting Twitter test agent...")
    logs.push(`🔍 Target: @${username}`)
    logs.push(`🔑 Looking for code: ${code}`)

    logs.push("🚀 Launching browser...")
    browser = await launchBrowser()

    const page = await browser.newPage()
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36')
    await page.setViewport({ width: 1280, height: 720 })

    logs.push("🔐 Logging into Twitter...")
    
    try {
      // Navigate to Twitter login
      await page.goto('https://x.com/i/flow/login', { waitUntil: 'networkidle2', timeout: 30000 })
      
      // Wait for and fill email
      await page.waitForSelector('input[name="text"]', { timeout: 15000 })
      await page.type('input[name="text"]', twitterEmail, { delay: 100 })
      
      // Click Next
      const nextButtons = await page.$$('[role="button"]')
      for (const button of nextButtons) {
        const text = await page.evaluate((el: any) => el.textContent, button)
        if (text && text.includes('Next')) {
          await button.click()
          break
        }
      }
      
      // Wait for and fill password
      await page.waitForSelector('input[name="password"]', { timeout: 15000 })
      await page.type('input[name="password"]', twitterPassword, { delay: 100 })
      
      // Click Login
      await page.click('[data-testid="LoginForm_Login_Button"]')
      
      // Wait for login to complete
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 })
      
      logs.push("✅ Successfully logged into Twitter")
      
    } catch (loginError) {
      logs.push(`❌ Login failed: ${loginError instanceof Error ? loginError.message : String(loginError)}`)
      return {
        success: false,
        error: "Failed to login to Twitter",
        logs: logs
      }
    }
    
    logs.push(`📍 Navigating to @${username} profile...`)
    
    // Navigate to profile
    await page.goto(`https://x.com/${username}`, { waitUntil: 'networkidle2', timeout: 20000 })
    
    await page.waitForTimeout(3000)
    
    // Extract bio with detailed logging
    let bio = ''
    const bioSelectors = [
      '[data-testid="UserDescription"]',
      '[data-testid="UserBio"]', 
      '.css-1dbjc4n.r-1s2bzr4 > .css-901oao',
      '.ProfileHeaderCard-bio',
      '.ProfileCard-content .u-dir'
    ]
    
    logs.push(`🔍 Trying ${bioSelectors.length} bio selectors...`)
    
    for (let i = 0; i < bioSelectors.length; i++) {
      const selector = bioSelectors[i]
      try {
        logs.push(`Trying selector ${i+1}: ${selector}`)
        const bioElement = await page.$(selector)
        if (bioElement) {
          bio = await page.evaluate((el: any) => el.textContent || '', bioElement)
          if (bio && bio.trim()) {
            logs.push(`📝 SUCCESS with selector ${i+1}: Found bio`)
            break
          } else {
            logs.push(`📝 Selector ${i+1} found element but no text content`)
          }
        } else {
          logs.push(`📝 Selector ${i+1} found no element`)
        }
      } catch (e) {
        logs.push(`📝 Selector ${i+1} error: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
    
    if (!bio || !bio.trim()) {
      // Try to get page content for debugging
      const pageTitle = await page.title()
      const url = await page.url()
      logs.push(`❌ No bio found. Page title: "${pageTitle}", URL: "${url}"`)
      
      // Take a screenshot of what we're seeing (base64)
      try {
        const screenshot = await page.screenshot({ encoding: 'base64', fullPage: false })
        logs.push(`📸 Page screenshot captured (${screenshot.length} chars)`)
      } catch (e) {
        logs.push(`📸 Screenshot failed: ${e instanceof Error ? e.message : String(e)}`)
      }
      
      return {
        success: false,
        error: "Could not extract bio content from Twitter profile",
        logs: logs
      }
    }
    
    logs.push(`📄 Bio extracted (${bio.length} chars): "${bio.substring(0, 200)}${bio.length > 200 ? '...' : ''}"`)
    
    // Search for code
    const codeFound = bio.toLowerCase().includes(code.toLowerCase())
    logs.push(`🔍 Code search: "${code}" ${codeFound ? '✅ FOUND' : '❌ NOT FOUND'}`)
    
    if (!codeFound) {
      logs.push(`📋 Full bio content: "${bio}"`)
      logs.push(`🔑 Expected code: "${code}"`)
    }
    
    return {
      success: codeFound,
      error: codeFound ? undefined : `Code "${code}" not found in bio`,
      logs: logs,
      bio: bio
    }

  } catch (error) {
    console.error('Twitter agent error:', error)
    logs.push(`❌ Agent error: ${error instanceof Error ? error.message : String(error)}`)
    logs.push(`❌ Error stack: ${error instanceof Error ? error.stack : 'No stack trace'}`)
    logs.push(`❌ Error type: ${typeof error}`)
    logs.push(`❌ Error details: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Twitter agent test failed",
      logs: logs
    }
  } finally {
    if (browser) {
      await browser.close()
      logs.push("🔒 Browser closed")
    }
  }
}

async function testInstagramAgent(username: string, code: string): Promise<AgentResult> {
  return {
    success: false,
    error: "Instagram test agent not implemented yet",
    logs: ["🚧 Instagram test coming soon"]
  }
}
