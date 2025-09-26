import { NextResponse } from "next/server"
import { conditionalConnect } from "../../lib/db-retry"

export async function GET() {
  try {
    const dbConnected = await conditionalConnect()
    
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: dbConnected ? "connected" : "disconnected",
      version: process.env.npm_package_version || "unknown",
    }

    return NextResponse.json(health, { status: 200 })
  } catch (error) {
    console.error("Health check failed:", error)
    
    return NextResponse.json(
      { 
        status: "error", 
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
