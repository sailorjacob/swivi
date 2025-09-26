/**
 * Puppeteer configuration for serverless environments
 */

export async function launchBrowser() {
  const puppeteer = require('puppeteer')
  
  return await puppeteer.launch({
    headless: true,
    executablePath: puppeteer.executablePath(),
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
      '--single-process'
    ],
    timeout: 30000
  })
}
