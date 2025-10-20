// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const { username = "elonmusk", platform = "twitter" } = await request.json()
  
  const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY
  
  if (!BROWSERLESS_API_KEY) {
    return NextResponse.json({
      success: false,
      error: "BROWSERLESS_API_KEY not configured"
    }, { status: 500 })
  }

  const logs: string[] = []
  const results: any = {}
  
  logs.push(`🧪 Testing all Browserless methods for @${username}`)
  logs.push(`🔑 API Key: ${BROWSERLESS_API_KEY.substring(0, 10)}...`)

  // Method 1: /scrape API (current method)
  try {
    logs.push(`
📡 METHOD 1: /scrape API`)
    
    const profileUrl = platform === 'twitter' ? `https://x.com/${username}` : `https://instagram.com/${username}`
    const bioSelectors = platform === 'twitter' 
      ? ['[data-testid="UserDescription"]', '[data-testid="UserBio"]']
      : ['.-vDIg span', 'section div span']

    const scrapeRequest = {
      url: profileUrl,
      elements: bioSelectors.map(selector => ({ selector })),
      gotoOptions: {
        waitUntil: "domcontentloaded",
        timeout: 30000
      }
    }

    const scrapeResponse = await fetch(`https://production-sfo.browserless.io/scrape?token=${BROWSERLESS_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scrapeRequest)
    })

    if (scrapeResponse.ok) {
      const scrapeResult = await scrapeResponse.json()
      results.scrapeAPI = {
        success: true,
        status: scrapeResponse.status,
        data: scrapeResult
      }
      logs.push(`✅ /scrape API: SUCCESS`)
      logs.push(`📄 Found ${scrapeResult.data?.[0]?.results?.length || 0} elements`)
    } else {
      const errorText = await scrapeResponse.text()
      results.scrapeAPI = {
        success: false,
        status: scrapeResponse.status,
        error: errorText
      }
      logs.push(`❌ /scrape API: ${scrapeResponse.status} - ${errorText.substring(0, 200)}`)
    }
  } catch (error) {
    results.scrapeAPI = {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
    logs.push(`❌ /scrape API: ${error}`)
  }

  // Method 2: /content API (alternative)
  try {
    logs.push(`
📡 METHOD 2: /content API`)
    
    const profileUrl = platform === 'twitter' ? `https://x.com/${username}` : `https://instagram.com/${username}`
    
    const contentResponse = await fetch(`https://production-sfo.browserless.io/content?token=${BROWSERLESS_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: profileUrl,
        gotoOptions: {
          waitUntil: "domcontentloaded",
          timeout: 30000
        }
      })
    })

    if (contentResponse.ok) {
      const contentResult = await contentResponse.text()
      results.contentAPI = {
        success: true,
        status: contentResponse.status,
        htmlLength: contentResult.length,
        containsBio: contentResult.includes('bio') || contentResult.includes('description'),
        sample: contentResult.substring(0, 500)
      }
      logs.push(`✅ /content API: SUCCESS`)
      logs.push(`📄 HTML length: ${contentResult.length} chars`)
      logs.push(`🔍 Contains bio keywords: ${results.contentAPI.containsBio}`)
    } else {
      const errorText = await contentResponse.text()
      results.contentAPI = {
        success: false,
        status: contentResponse.status,
        error: errorText
      }
      logs.push(`❌ /content API: ${contentResponse.status} - ${errorText.substring(0, 200)}`)
    }
  } catch (error) {
    results.contentAPI = {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
    logs.push(`❌ /content API: ${error}`)
  }

  // Method 3: /screenshot API (to see what's actually rendered)
  try {
    logs.push(`
📸 METHOD 3: /screenshot API`)
    
    const profileUrl = platform === 'twitter' ? `https://x.com/${username}` : `https://instagram.com/${username}`
    
    const screenshotResponse = await fetch(`https://production-sfo.browserless.io/screenshot?token=${BROWSERLESS_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: profileUrl,
        options: {
          type: "png",
          quality: 80,
          fullPage: false
        },
        gotoOptions: {
          waitUntil: "domcontentloaded",
          timeout: 30000
        }
      })
    })

    if (screenshotResponse.ok) {
      const screenshotBuffer = await screenshotResponse.arrayBuffer()
      results.screenshotAPI = {
        success: true,
        status: screenshotResponse.status,
        imageSize: screenshotBuffer.byteLength,
        base64: `data:image/png;base64,${Buffer.from(screenshotBuffer).toString('base64').substring(0, 100)}...`
      }
      logs.push(`✅ /screenshot API: SUCCESS`)
      logs.push(`📸 Image size: ${screenshotBuffer.byteLength} bytes`)
    } else {
      const errorText = await screenshotResponse.text()
      results.screenshotAPI = {
        success: false,
        status: screenshotResponse.status,
        error: errorText
      }
      logs.push(`❌ /screenshot API: ${screenshotResponse.status} - ${errorText.substring(0, 200)}`)
    }
  } catch (error) {
    results.screenshotAPI = {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
    logs.push(`❌ /screenshot API: ${error}`)
  }

  // Method 4: Test simple example.com to verify API key works
  try {
    logs.push(`
🧪 METHOD 4: Test with example.com`)
    
    const testResponse = await fetch(`https://production-sfo.browserless.io/scrape?token=${BROWSERLESS_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: "https://example.com",
        elements: [{ selector: "h1" }],
        gotoOptions: {
          waitUntil: "domcontentloaded",
          timeout: 10000
        }
      })
    })

    if (testResponse.ok) {
      const testResult = await testResponse.json()
      results.exampleTest = {
        success: true,
        status: testResponse.status,
        data: testResult
      }
      logs.push(`✅ Example.com test: SUCCESS`)
      logs.push(`📄 Found: ${testResult.data?.[0]?.results?.[0]?.innerText || 'No text'}`)
    } else {
      const errorText = await testResponse.text()
      results.exampleTest = {
        success: false,
        status: testResponse.status,
        error: errorText
      }
      logs.push(`❌ Example.com test: ${testResponse.status} - ${errorText.substring(0, 200)}`)
    }
  } catch (error) {
    results.exampleTest = {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
    logs.push(`❌ Example.com test: ${error}`)
  }

  // Summary
  logs.push(`
📊 SUMMARY:`)
  logs.push(`- /scrape API: ${results.scrapeAPI?.success ? '✅' : '❌'}`)
  logs.push(`- /content API: ${results.contentAPI?.success ? '✅' : '❌'}`)
  logs.push(`- /screenshot API: ${results.screenshotAPI?.success ? '✅' : '❌'}`)
  logs.push(`- Example test: ${results.exampleTest?.success ? '✅' : '❌'}`)

  return NextResponse.json({
    success: true,
    logs,
    results,
    recommendations: {
      apiKeyWorking: results.exampleTest?.success || false,
      socialMediaBlocking: !results.scrapeAPI?.success && results.exampleTest?.success,
      bestMethod: results.scrapeAPI?.success ? 'scrape' : 
                 results.contentAPI?.success ? 'content' : 
                 results.screenshotAPI?.success ? 'screenshot' : 'none'
    }
  })
}
