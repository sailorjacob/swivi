// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username') || 'instagram'
    
    const url = `https://www.instagram.com/${username}/`
    console.log(`🔍 Debug: Testing Instagram URL: ${url}`)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      signal: AbortSignal.timeout(15000)
    })
    
    console.log(`📊 Instagram response status: ${response.status}`)
    
    if (!response.ok) {
      return NextResponse.json({
        error: "Instagram request failed",
        status: response.status,
        statusText: response.statusText,
        url: url,
        possible_causes: [
          response.status === 429 ? "Rate limited by Instagram" : null,
          response.status === 403 ? "IP blocked or private profile" : null,
          response.status === 404 ? "Profile not found or deleted" : null,
          "Instagram anti-bot protection"
        ].filter(Boolean)
      }, { status: 400 })
    }
    
    const html = await response.text()
    const htmlLength = html.length
    
    // Check for common blocking indicators
    const indicators = {
      hasProfileData: html.includes('profile') || html.includes('biography'),
      isBlocked: html.includes('challenge') || html.includes('checkpoint'),
      isPrivate: html.includes('This Account is Private') || html.includes('private'),
      isNotFound: html.includes('User not found') || html.includes('Page Not Found'),
      hasJsonData: html.includes('"biography":') || html.includes('"description":'),
      htmlSnippet: html.substring(0, 500)
    }
    
    // Try to extract bio using our patterns
    const patterns = [
      /"biography":"([^"]*(?:\.[^"]*)*)"/,
      /"description":"([^"]*(?:\.[^"]*)*)"/,
      /"bio":"([^"]*(?:\.[^"]*)*)"/
    ]
    
    let foundBio = null
    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match && match[1]) {
        foundBio = match[1]
        break
      }
    }
    
    return NextResponse.json({
      status: "success",
      url: url,
      response_status: response.status,
      html_length: htmlLength,
      bio_found: foundBio,
      indicators,
      test_bio_extraction: foundBio ? "✅ Bio extraction working" : "❌ Bio extraction failed"
    })
    
  } catch (error) {
    console.error("❌ Instagram debug failed:", error)
    
    return NextResponse.json({
      error: "Instagram debug failed",
      details: error instanceof Error ? error.message : String(error),
      possible_causes: [
        "Network timeout",
        "Instagram blocking Vercel IPs",
        "DNS resolution issues",
        "Serverless function limitations"
      ]
    }, { status: 500 })
  }
}
