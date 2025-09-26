/**
 * BrowserQL client for Browserless.io - much simpler than Puppeteer!
 */

interface BrowserQLResponse {
  data?: any
  errors?: Array<{ message: string }>
}

interface ScreenshotResult {
  base64: string
}

interface GotoResult {
  status: number
}

export class BrowserQLClient {
  private endpoint: string
  private token: string

  constructor() {
    this.endpoint = "https://production-sfo.browserless.io/chromium/bql"
    this.token = process.env.BROWSERLESS_API_KEY || ""
  }

  async executeQuery(query: string, variables: Record<string, any> = {}): Promise<BrowserQLResponse> {
    if (!this.token) {
      throw new Error("BROWSERLESS_API_KEY is required")
    }

    console.log(`🌐 Executing BrowserQL query...`)
    
    const response = await fetch(`${this.endpoint}?token=${this.token}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query,
        variables
      })
    })

    if (!response.ok) {
      throw new Error(`BrowserQL request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.errors && data.errors.length > 0) {
      throw new Error(`BrowserQL errors: ${data.errors.map((e: any) => e.message).join(', ')}`)
    }

    return data
  }

  /**
   * Navigate to a URL and get page title and screenshot
   */
  async getBasicPageInfo(url: string): Promise<{ title: string, screenshot?: string }> {
    const query = `
      mutation GetBasicPageInfo($url: String!) {
        goto(url: $url, waitUntil: load) {
          status
        }
        title {
          title
        }
        screenshot(type: jpeg, quality: 50) {
          base64
        }
      }
    `

    const result = await this.executeQuery(query, { url })

    return {
      title: result.data?.title?.title || '',
      screenshot: result.data?.screenshot?.base64
    }
  }

  /**
   * Navigate to a URL and get the page HTML
   */
  async getPageContent(url: string): Promise<{ html: string, screenshot?: string }> {
    const query = `
      mutation GetPageContent($url: String!) {
        goto(url: $url, waitUntil: load) {
          status
        }
        content(html: "body") {
          html
        }
        screenshot(type: jpeg, quality: 30) {
          base64
        }
      }
    `

    const result = await this.executeQuery(query, { url })

    return {
      html: result.data?.content?.html || '',
      screenshot: result.data?.screenshot?.base64
    }
  }

  /**
   * Navigate to a URL and extract text from specific selectors (simplified approach)
   */
  async extractBioContent(url: string, selectors: string[]): Promise<{ bioTexts: string[], screenshot?: string }> {
    // Try one selector at a time to avoid complex GraphQL queries
    const bioTexts: string[] = []
    let screenshot: string | undefined

    for (let i = 0; i < Math.min(selectors.length, 3); i++) { // Limit to 3 selectors to avoid timeout
      try {
        const query = `
          mutation ExtractSingleBio($url: String!, $selector: String!) {
            goto(url: $url, waitUntil: load) {
              status
            }
            element: querySelector(selector: $selector) {
              text
            }
            screenshot(type: jpeg, quality: 30) {
              base64
            }
          }
        `

        const result = await this.executeQuery(query, { url, selector: selectors[i] })
        
        const text = result.data?.element?.text
        if (text && text.trim()) {
          bioTexts.push(text.trim())
        }
        
        // Capture screenshot from first successful query
        if (!screenshot && result.data?.screenshot?.base64) {
          screenshot = result.data.screenshot.base64
        }
      } catch (error) {
        console.log(`Selector ${i} failed:`, error)
        // Continue with next selector
      }
    }

    return {
      bioTexts,
      screenshot
    }
  }

  /**
   * Test the connection to Browserless.io
   */
  async testConnection(): Promise<{ success: boolean, message: string }> {
    try {
      const query = `
        mutation TestConnection {
          goto(url: "https://example.com", waitUntil: load) {
            status
          }
          element: querySelector(selector: "h1") {
            text
          }
        }
      `

      const result = await this.executeQuery(query)
      
      return {
        success: true,
        message: `Connected successfully! H1 text: ${result.data?.element?.text || 'Unknown'}`
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      }
    }
  }
}
