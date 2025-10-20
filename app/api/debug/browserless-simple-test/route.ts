// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY
    
    if (!BROWSERLESS_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "BROWSERLESS_API_KEY environment variable not set"
      }, { status: 500 })
    }

    const logs: string[] = []
    logs.push(`🔑 API Key present: ${BROWSERLESS_API_KEY.substring(0, 8)}...`)
    
    // Test 1: Simple /scrape request to example.com
    const scrapeRequest = {
      url: "https://example.com",
      elements: [
        {
          selector: "h1"
        }
      ],
      gotoOptions: {
        waitUntil: "networkidle2",
        timeout: 10000
      }
    }

    logs.push(`📡 Testing /scrape API with example.com...`)
    
    const scrapeResponse = await fetch(`https://production-sfo.browserless.io/scrape?token=${BROWSERLESS_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(scrapeRequest)
    })

    logs.push(`📊 Scrape response status: ${scrapeResponse.status}`)
    
    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text()
      logs.push(`❌ Scrape failed: ${errorText}`)
      
      return NextResponse.json({
        success: false,
        error: `Browserless /scrape failed: ${scrapeResponse.status} ${scrapeResponse.statusText}`,
        errorDetails: errorText,
        logs
      }, { status: 500 })
    }

    const scrapeResult = await scrapeResponse.json()
    logs.push(`✅ Scrape successful!`)
    logs.push(`📄 Results: ${JSON.stringify(scrapeResult, null, 2)}`)

    // Test 2: Simple screenshot request
    logs.push(`📸 Testing screenshot API...`)
    
    const screenshotResponse = await fetch(`https://production-sfo.browserless.io/screenshot?token=${BROWSERLESS_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: "https://example.com",
        options: {
          type: "jpeg",
          quality: 50,
          fullPage: false
        }
      })
    })

    logs.push(`📊 Screenshot response status: ${screenshotResponse.status}`)
    
    let screenshotSuccess = false
    if (screenshotResponse.ok) {
      const screenshotBuffer = await screenshotResponse.arrayBuffer()
      screenshotSuccess = screenshotBuffer.byteLength > 0
      logs.push(`📸 Screenshot ${screenshotSuccess ? 'successful' : 'failed'}: ${screenshotBuffer.byteLength} bytes`)
    } else {
      const errorText = await screenshotResponse.text()
      logs.push(`❌ Screenshot failed: ${errorText}`)
    }

    return NextResponse.json({
      success: true,
      apiKeyPresent: true,
      scrapeApiWorking: true,
      screenshotApiWorking: screenshotSuccess,
      scrapeResult,
      logs
    })

  } catch (error) {
    console.error('Browserless test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Test failed",
      logs: [`❌ Error: ${error instanceof Error ? error.message : String(error)}`]
    }, { status: 500 })
  }
}
