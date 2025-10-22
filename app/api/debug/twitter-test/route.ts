// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username') || 'elonmusk'
    const code = searchParams.get('code') || 'TEST123'

    console.log(`🔍 Testing Twitter scraping for @${username} with code "${code}"`)

    const url = `https://x.com/${username}`
    console.log(`📍 Fetching: ${url}`)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      signal: AbortSignal.timeout(15000)
    })

    console.log(`📊 Response status: ${response.status}`)

    if (!response.ok) {
      return NextResponse.json({
        error: `Twitter returned ${response.status}`,
        url: url,
        username: username,
        status: response.status
      }, { status: response.status })
    }

    const html = await response.text()
    console.log(`📄 HTML length: ${html.length}`)

    // Enhanced patterns for bio extraction
    const patterns = [
      /"description":"([^"]*(?:\.[^"]*)*)"/,
      /"bio":"([^"]*(?:\.[^"]*)*)"/,
      /description['"]:[\s]*['"]([^'"]*)['"],/,
      /<meta\s+name=['"]description['"][^>]*content=['"]([^'"]*)['"][^>]*>/,
      /<meta\s+property=['"]og:description['"][^>]*content=['"]([^'"]*)['"][^>]*>/
    ]

    let bio = ''
    let patternUsed = -1

    for (let i = 0; i < patterns.length; i++) {
      const match = html.match(patterns[i])
      if (match && match[1] && match[1].trim()) {
        bio = match[1].trim()
        patternUsed = i
        break
      }
    }

    if (!bio) {
      // Show a sample of the HTML to debug
      const htmlSample = html.substring(0, 1000)
      return NextResponse.json({
        error: "No bio found",
        username: username,
        url: url,
        html_length: html.length,
        html_sample: htmlSample,
        patterns_tried: patterns.length
      })
    }

    // Decode entities
    const decodedBio = bio
      .replace(/\u[\dA-F]{4}/gi, (match) => {
        return String.fromCharCode(parseInt(match.replace(/\u/g, ''), 16))
      })
      .replace(/\n/g, ' ')
      .replace(/	/g, ' ')
      .replace(/\"/g, '"')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')

    // Check for code
    const codeFound = decodedBio.toLowerCase().includes(code.toLowerCase())

    return NextResponse.json({
      success: true,
      username: username,
      url: url,
      pattern_used: patternUsed + 1,
      bio_found: decodedBio,
      looking_for_code: code,
      code_found: codeFound,
      html_length: html.length
    })

  } catch (error) {
    console.error("Twitter test failed:", error)
    return NextResponse.json({
      error: "Test failed",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
