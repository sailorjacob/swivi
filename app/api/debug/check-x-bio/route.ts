// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { username, code } = await request.json()
    
    if (!username) {
      return NextResponse.json({ 
        error: "Username is required" 
      }, { status: 400 })
    }

    const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY
    
    if (!BROWSERLESS_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "BROWSERLESS_API_KEY environment variable not set"
      }, { status: 500 })
    }

    const logs: string[] = []
    const profileUrl = `https://x.com/${username}`
    logs.push(`🔍 Checking X.com profile: ${profileUrl}`)
    if (code) {
      logs.push(`🎯 Looking for code: ${code}`)
    }

    // Use multiple bio selectors for X.com
    const bioSelectors = [
      '[data-testid="UserDescription"]',
      '[data-testid="UserBio"]', 
      'div[data-testid="UserDescription"] span',
      '[data-testid="UserProfileHeader_Items"] div[lang]',
      'div[role="tabpanel"] div[lang]',
      // Additional selectors for X.com bio
      '[data-testid="UserDescription"] div',
      'div[data-testid="UserDescription"]',
      'section div[lang]',
      'article div[lang]'
    ]

    const scrapeRequest = {
      url: profileUrl,
      elements: bioSelectors.map(selector => ({ selector })),
      gotoOptions: {
        waitUntil: "networkidle2",
        timeout: 30000
      }
    }

    logs.push(`📡 Sending scrape request with ${bioSelectors.length} selectors...`)
    
    const response = await fetch(`https://production-sfo.browserless.io/scrape?token=${BROWSERLESS_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(scrapeRequest)
    })

    logs.push(`📊 Response status: ${response.status}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      logs.push(`❌ Request failed: ${errorText}`)
      
      return NextResponse.json({
        success: false,
        error: `Browserless scrape failed: ${response.status} ${response.statusText}`,
        errorDetails: errorText,
        logs
      }, { status: 500 })
    }

    const result = await response.json()
    logs.push(`✅ Scrape completed successfully`)

    // Extract bio texts from results
    const bioTexts: string[] = []
    
    if (result.data && result.data.length > 0) {
      const pageResults = result.data[0].results || []
      logs.push(`📄 Found ${pageResults.length} element results`)
      
      for (const elementResult of pageResults) {
        if (elementResult.innerText && elementResult.innerText.trim()) {
          const text = elementResult.innerText.trim()
          bioTexts.push(text)
          logs.push(`📝 Selector "${elementResult.selector}": "${text.substring(0, 150)}${text.length > 150 ? '...' : ''}"`)
        }
      }
    } else {
      logs.push(`⚠️ No results returned from scrape API`)
    }

    // Combine all bio texts
    const combinedBio = bioTexts.join(' ').trim()
    logs.push(`📝 Combined bio length: ${combinedBio.length} characters`)
    
    if (combinedBio) {
      logs.push(`📝 Combined bio: "${combinedBio.substring(0, 300)}${combinedBio.length > 300 ? '...' : ''}"`)
    }

    // Search for code if provided
    let codeFound = false
    let codeContext = ""
    if (code && combinedBio) {
      // Try different variations of the code
      const codeVariations = [
        code,
        code.toUpperCase(),
        code.toLowerCase(),
        ` ${code} `,
        `"${code}"`,
        `'${code}'`
      ]
      
      for (const variation of codeVariations) {
        if (combinedBio.includes(variation)) {
          codeFound = true
          // Find context around the code
          const index = combinedBio.indexOf(variation)
          const start = Math.max(0, index - 50)
          const end = Math.min(combinedBio.length, index + variation.length + 50)
          codeContext = `...${combinedBio.substring(start, end)}...`
          logs.push(`✅ Found code variation "${variation}" in bio`)
          logs.push(`📍 Context: ${codeContext}`)
          break
        }
      }
      
      if (!codeFound) {
        logs.push(`❌ Code "${code}" not found in bio`)
      }
    }

    return NextResponse.json({
      success: true,
      username,
      code: code || null,
      profileUrl,
      bioTexts,
      combinedBio: combinedBio.substring(0, 500), // Limit for response size
      bioLength: combinedBio.length,
      codeFound: code ? codeFound : null,
      codeContext: codeContext || null,
      screenshot: null, // Screenshots require separate API call
      logs
    })

  } catch (error) {
    console.error('X.com bio check error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Check failed",
      logs: [`❌ Error: ${error instanceof Error ? error.message : String(error)}`]
    }, { status: 500 })
  }
}
