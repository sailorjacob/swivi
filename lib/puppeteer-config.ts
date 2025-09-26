/**
 * Puppeteer configuration using Browserless.io for serverless environments
 */

export async function launchBrowser() {
  const puppeteer = require('puppeteer-core')
  
  const browserlessToken = process.env.BROWSERLESS_API_KEY
  
  if (browserlessToken) {
    // Use Browserless.io cloud service
    console.log(`🌐 Connecting to Browserless.io cloud browser...`)
    
    const browser = await puppeteer.connect({
      browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessToken}&stealth&blockAds`,
      defaultViewport: { width: 1280, height: 720 }
    })
    
    console.log(`✅ Connected to Browserless.io cloud browser`)
    return browser
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
