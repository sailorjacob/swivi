/**
 * Puppeteer configuration for serverless environments
 */

export async function launchBrowser() {
  const puppeteer = require('puppeteer')
  
  // Try different Chrome installation approaches for serverless
  let executablePath
  
  try {
    // First try: Use puppeteer's bundled Chromium
    executablePath = await puppeteer.executablePath()
    console.log(`📍 Trying Puppeteer bundled Chrome: ${executablePath}`)
  } catch (error) {
    console.log(`⚠️ Puppeteer bundled Chrome not found: ${error}`)
    
    // Try common Chrome paths in different environments
    const chromePaths = [
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/opt/google/chrome/chrome',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    ]
    
    for (const path of chromePaths) {
      try {
        const fs = require('fs')
        if (fs.existsSync(path)) {
          executablePath = path
          console.log(`✅ Found Chrome at: ${path}`)
          break
        }
      } catch (e) {
        continue
      }
    }
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
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-features=VizDisplayCompositor',
      '--single-process',
      '--disable-web-security',
      '--disable-features=site-per-process'
    ],
    timeout: 30000
  }
  
  // Only set executablePath if we found one
  if (executablePath) {
    launchOptions.executablePath = executablePath
    console.log(`🚀 Launching browser with executablePath: ${executablePath}`)
  } else {
    console.log(`🚀 Launching browser with default Puppeteer configuration`)
  }
  
  return await puppeteer.launch(launchOptions)
}
