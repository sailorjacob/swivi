/**
 * Puppeteer configuration using Browserless.io for serverless environments
 */

export async function launchBrowser() {
  const puppeteer = require('puppeteer-core')
  
  const browserlessToken = process.env.BROWSERLESS_API_KEY
  
  if (browserlessToken) {
    // Use Browserless.io cloud service
    console.log(`🌐 Connecting to Browserless.io cloud browser...`)
    console.log(`🔑 Using API key: ${browserlessToken.substring(0, 10)}...${browserlessToken.slice(-5)}`)
    
    try {
      const wsEndpoint = `wss://chrome.browserless.io?token=${browserlessToken}&stealth&blockAds`
      console.log(`🔗 WebSocket endpoint: ${wsEndpoint.replace(browserlessToken, '[TOKEN]')}`)
      
      const browser = await puppeteer.connect({
        browserWSEndpoint: wsEndpoint,
        defaultViewport: { width: 1280, height: 720 }
      })
      
      console.log(`✅ Connected to Browserless.io cloud browser`)
      return browser
    } catch (error) {
      console.error(`❌ Browserless.io connection failed:`, error)
      throw new Error(`Browserless connection failed: ${error instanceof Error ? error.message : String(error)}`)
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
