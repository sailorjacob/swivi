/**
 * Puppeteer configuration using Browserless.io for serverless environments
 */

export async function launchBrowser() {
  const puppeteer = require('puppeteer-core')
  
  const browserlessToken = process.env.BROWSERLESS_API_KEY
  
  if (browserlessToken) {
    // Use Browserless.io cloud service
    console.log(`🌐 Connecting to Browserless.io cloud browser...`)
    
    try {
      const wsEndpoint = `wss://production-sfo.browserless.io?token=${browserlessToken}&stealth&blockAds`
      console.log(`🔗 WebSocket endpoint: ${wsEndpoint.replace(browserlessToken, '[TOKEN]')}`)
      
      const browser = await puppeteer.connect({
        browserWSEndpoint: wsEndpoint,
        defaultViewport: { width: 1280, height: 720 },
        timeout: 30000
      })
      
      console.log(`✅ Connected to Browserless.io cloud browser`)
      return browser
    } catch (error) {
      console.error(`❌ Browserless.io connection failed:`, error)
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
      const errorDetails = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
      console.error(`❌ Error details: ${errorDetails}`)
      throw new Error(`Browserless connection failed: ${errorDetails}`)
    }
  } else {
    // Fallback to local Puppeteer (for development)
    console.log(`🔄 Browserless token not found, trying local Puppeteer...`)
    
    const puppeteerLocal = require('puppeteer')
    
    let executablePath
    try {
      executablePath = puppeteerLocal.executablePath()
    } catch (error) {
      console.log(`⚠️ Local Chrome not found: ${error}`)
    }
    
    const launchOptions: any = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ],
      timeout: 30000
    }
    
    if (executablePath) {
      launchOptions.executablePath = executablePath
    }
    
    return await puppeteerLocal.launch(launchOptions)
  }
}
