import { NextRequest, NextResponse } from "next/server"
import { launchBrowser } from "@/lib/puppeteer-config"

export async function GET(request: NextRequest) {
  console.log("🧪 Testing Browserless.io connection...")
  
  let browser
  const logs: string[] = []
  
  try {
    logs.push("🚀 Starting Browserless connection test...")
    
    const start = Date.now()
    browser = await launchBrowser()
    const connectTime = Date.now() - start
    
    logs.push(`✅ Browser connected in ${connectTime}ms`)
    
    const page = await browser.newPage()
    logs.push("✅ New page created")
    
    await page.goto('https://example.com', { waitUntil: 'domcontentloaded', timeout: 10000 })
    logs.push("✅ Page navigation successful")
    
    const title = await page.title()
    logs.push(`✅ Page title: "${title}"`)
    
    await page.close()
    logs.push("✅ Page closed")
    
    return NextResponse.json({
      success: true,
      message: "Browserless.io connection test successful",
      connectionTime: `${connectTime}ms`,
      logs
    })
    
  } catch (error) {
    console.error('Browserless test error:', error)
    logs.push(`❌ Error: ${error instanceof Error ? error.message : String(error)}`)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Browserless test failed",
      logs
    })
    
  } finally {
    if (browser) {
      try {
        await browser.close()
        logs.push("🔒 Browser closed")
      } catch (e) {
        logs.push(`⚠️ Browser close error: ${e}`)
      }
    }
  }
}
