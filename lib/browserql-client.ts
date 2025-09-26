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
        "Content-Type": "application/json",
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
   * Navigate to a URL and extract text content from specific selectors
   */
  async extractContent(url: string, selectors: string[]): Promise<{ content: string[], screenshot?: string }> {
    const query = `
      mutation ExtractContent($url: String!, $selectors: [String!]!) {
        goto(url: $url, waitUntil: load) {
          status
        }
        content: querySelectorAll(selector: $selectors) {
          text
        }
        screenshot(type: jpeg, quality: 50) {
          base64
        }
      }
    `

    const result = await this.executeQuery(query, { 
      url, 
      selectors 
    })

    return {
      content: result.data?.content?.map((item: any) => item.text) || [],
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
        content: content {
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
   * Test the connection to Browserless.io
   */
  async testConnection(): Promise<{ success: boolean, message: string }> {
    try {
      const query = `
        mutation TestConnection {
          goto(url: "https://example.com", waitUntil: load) {
            status
          }
          content: querySelector(selector: "h1") {
            text
          }
        }
      `

      const result = await this.executeQuery(query)
      
      return {
        success: true,
        message: `Connected successfully! Page title: ${result.data?.content?.text || 'Unknown'}`
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      }
    }
  }
}
