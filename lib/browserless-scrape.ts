/**
 * Browserless.io /scrape API client - much better than BrowserQL for content extraction
 */

interface ScrapeElement {
  selector: string
  attribute?: string
}

interface ScrapeRequest {
  url: string
  elements: ScrapeElement[]
  gotoOptions?: {
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2'
    timeout?: number
  }
  screenshot?: {
    type?: 'png' | 'jpeg'
    quality?: number
    fullPage?: boolean
  }
}

interface ScrapeResponse {
  data: Array<{
    results: Array<{
      selector: string
      innerText?: string
      innerHTML?: string
      attributes?: Record<string, string>
    }>
  }>
  screenshot?: string
}

export class BrowserlessScrapeClient {
  private endpoint: string
  private token: string

  constructor() {
    this.endpoint = "https://production-sfo.browserless.io/scrape"
    this.token = process.env.BROWSERLESS_API_KEY || ""
  }

  async scrapeProfile(url: string, bioSelectors: string[]): Promise<{
    bioTexts: string[]
    screenshot?: string
    logs: string[]
  }> {
    if (!this.token) {
      throw new Error("BROWSERLESS_API_KEY is required")
    }

    const logs: string[] = []
    logs.push(`🌐 Scraping profile: ${url}`)
    logs.push(`🎯 Using ${bioSelectors.length} bio selectors`)

    // Convert selectors to scrape elements
    const elements: ScrapeElement[] = bioSelectors.map(selector => ({
      selector,
      // Get both text and HTML for flexibility
    }))

    const scrapeRequest: ScrapeRequest = {
      url,
      elements,
      gotoOptions: {
        waitUntil: 'networkidle2', // Wait for content to load
        timeout: 30000
      },
      screenshot: {
        type: 'jpeg',
        quality: 50,
        fullPage: false
      }
    }

    logs.push(`📡 Sending scrape request...`)
    
    const response = await fetch(`${this.endpoint}?token=${this.token}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(scrapeRequest)
    })

    if (!response.ok) {
      const errorText = await response.text()
      logs.push(`❌ Scrape request failed: ${response.status} ${response.statusText}`)
      logs.push(`❌ Error details: ${errorText}`)
      throw new Error(`Browserless scrape failed: ${response.status} ${response.statusText}`)
    }

    const result: ScrapeResponse = await response.json()
    logs.push(`✅ Scrape completed successfully`)

    // Extract bio texts from results
    const bioTexts: string[] = []
    
    if (result.data && result.data.length > 0) {
      const pageResults = result.data[0].results || []
      logs.push(`📄 Found ${pageResults.length} element results`)
      
      for (const elementResult of pageResults) {
        if (elementResult.innerText && elementResult.innerText.trim()) {
          bioTexts.push(elementResult.innerText.trim())
          logs.push(`📝 Extracted text from ${elementResult.selector}: "${elementResult.innerText.substring(0, 100)}${elementResult.innerText.length > 100 ? '...' : ''}"`)
        }
      }
    } else {
      logs.push(`⚠️ No results returned from scrape API`)
    }

    return {
      bioTexts,
      screenshot: result.screenshot,
      logs
    }
  }

  /**
   * Test the scrape API with a simple request
   */
  async testConnection(url: string = "https://example.com"): Promise<{ success: boolean, message: string }> {
    try {
      const result = await this.scrapeProfile(url, ["h1", "title"])
      
      return {
        success: true,
        message: `Connected successfully! Extracted ${result.bioTexts.length} elements`
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      }
    }
  }
}
