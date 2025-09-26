import { NextRequest, NextResponse } from "next/server"
import { BrowserQLClient } from "@/lib/browserql-client"

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()
    
    if (!username) {
      return NextResponse.json({ 
        error: "Missing username" 
      }, { status: 400 })
    }

    const logs: string[] = []
    const instagramUsername = username.replace('@', '')
    const profileUrl = `https://www.instagram.com/${instagramUsername}/`
    
    logs.push(`🔍 Testing Instagram bio extraction for: ${profileUrl}`)

    const client = new BrowserQLClient()
    
    // Test many possible bio selectors
    const bioSelectors = [
      '.-vDIg span',
      'div.-vDIg', 
      'header section div div span',
      'div[data-testid="ig-bio"]',
      'article header div span',
      'section main article header section div span',
      'h1 + div span',
      'article section div span',
      'header div div span',
      'main article header section div',
      '[data-testid="user-bio"]',
      'meta[property="og:description"]',
      'meta[name="description"]'
    ]

    const results: any[] = []
    
    for (let i = 0; i < bioSelectors.length; i++) {
      try {
        logs.push(`🎯 Testing selector ${i + 1}: ${bioSelectors[i]}`)
        
        const result = await client.extractBioContent(profileUrl, [bioSelectors[i]])
        
        if (result.bioTexts.length > 0) {
          results.push({
            selector: bioSelectors[i],
            success: true,
            content: result.bioTexts[0],
            length: result.bioTexts[0].length
          })
          logs.push(`✅ Found content: "${result.bioTexts[0].substring(0, 100)}..."`)
        } else {
          results.push({
            selector: bioSelectors[i],
            success: false,
            content: null
          })
          logs.push(`❌ No content found`)
        }
      } catch (error) {
        results.push({
          selector: bioSelectors[i],
          success: false,
          error: error instanceof Error ? error.message : String(error)
        })
        logs.push(`❌ Error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    // Also try getting the full page HTML to see what's available
    let pageHtml = ""
    try {
      const htmlResult = await client.getPageContent(profileUrl)
      pageHtml = htmlResult.html.substring(0, 2000) // First 2000 chars
      logs.push(`📄 Got page HTML (${htmlResult.html.length} chars)`)
      
      // Look for "VZYCKP" in the HTML
      const hasCode = htmlResult.html.includes("VZYCKP")
      logs.push(`🔍 Code "VZYCKP" in HTML: ${hasCode ? 'FOUND' : 'NOT FOUND'}`)
    } catch (htmlError) {
      logs.push(`❌ HTML extraction failed: ${htmlError instanceof Error ? htmlError.message : String(htmlError)}`)
    }

    return NextResponse.json({
      success: true,
      username,
      profileUrl,
      totalSelectors: bioSelectors.length,
      successfulSelectors: results.filter(r => r.success).length,
      results,
      logs,
      pageHtmlPreview: pageHtml
    })

  } catch (error) {
    console.error('Instagram bio debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Test failed",
      logs: [`❌ Error: ${error instanceof Error ? error.message : String(error)}`]
    }, { status: 500 })
  }
}
