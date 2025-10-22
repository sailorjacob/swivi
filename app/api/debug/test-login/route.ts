// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Simple endpoint that just returns successful
  return NextResponse.json({
    message: "Test endpoint working",
    timestamp: new Date().toISOString(),
    url: request.url,
    host: request.headers.get('host'),
    user_agent: request.headers.get('user-agent'),
    cookies: request.headers.get('cookie') ? "present" : "missing"
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    return NextResponse.json({
      message: "Test POST endpoint working",
      timestamp: new Date().toISOString(),
      received_data: body,
      content_type: request.headers.get('content-type')
    })
  } catch (error) {
    return NextResponse.json({
      error: "Failed to parse JSON",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 400 })
  }
}
