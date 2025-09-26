import { NextRequest, NextResponse } from "next/server"
import { BrowserQLClient } from "@/lib/browserql-client"

export async function GET(request: NextRequest) {
  console.log("🧪 Testing BrowserQL connection...")
  
  const logs: string[] = []
  
  try {
    logs.push("🚀 Starting BrowserQL connection test...")
    
    const client = new BrowserQLClient()
    
    const start = Date.now()
    const testResult = await client.testConnection()
    const duration = Date.now() - start
    
    logs.push(`⏱️ Test completed in ${duration}ms`)
    logs.push(`📊 Result: ${testResult.message}`)
    
    if (testResult.success) {
      logs.push("✅ BrowserQL connection successful!")
      
      // Test Twitter profile extraction
      try {
        logs.push("🔍 Testing Twitter profile extraction...")
        
        const twitterResult = await client.getPageContent("https://twitter.com/elonmusk")
        logs.push(`📄 Twitter HTML length: ${twitterResult.html.length} chars`)
        logs.push(`📸 Screenshot captured: ${twitterResult.screenshot ? 'Yes' : 'No'}`)
        
        // Look for bio content in the HTML
        const bioPatterns = [
          /"description":"([^"]*(?:\\.[^"]*)*)"/g,
          /"bio":"([^"]*(?:\\.[^"]*)*)"/g
        ]
        
        let bioFound = false
        for (const pattern of bioPatterns) {
          const matches = twitterResult.html.match(pattern)
          if (matches && matches.length > 0) {
            logs.push(`🎯 Bio pattern found: ${matches[0].substring(0, 100)}...`)
            bioFound = true
            break
          }
        }
        
        if (!bioFound) {
          logs.push("⚠️ No bio patterns found in HTML")
        }
        
      } catch (twitterError) {
        logs.push(`⚠️ Twitter test failed: ${twitterError instanceof Error ? twitterError.message : String(twitterError)}`)
      }
      
      return NextResponse.json({
        success: true,
        message: "BrowserQL connection test successful",
        duration: `${duration}ms`,
        logs
      })
    } else {
      logs.push("❌ BrowserQL connection failed")
      return NextResponse.json({
        success: false,
        error: testResult.message,
        logs
      })
    }
    
  } catch (error) {
    console.error('BrowserQL test error:', error)
    logs.push(`❌ Error: ${error instanceof Error ? error.message : String(error)}`)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "BrowserQL test failed",
      logs
    })
  }
}
