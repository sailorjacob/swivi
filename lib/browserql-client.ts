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
   * Navigate to a URL and extract text from specific selectors
   */
  async extractBioContent(url: string, selectors: string[]): Promise<{ bioTexts: string[], screenshot?: string }> {
    // Use variables for selectors to avoid GraphQL syntax issues
    const variables: Record<string, any> = { url }
    const selectorFields: string[] = []
    
    selectors.forEach((selector, index) => {
      variables[`selector${index}`] = selector
      selectorFields.push(`
        bio${index}: querySelector(selector: $selector${index}) {
          text
        }`)
    })

    const query = `
      mutation ExtractBioContent($url: String!, ${selectors.map((_, index) => `$selector${index}: String!`).join(', ')}) {
        goto(url: $url, waitUntil: load) {
          status
        }
        ${selectorFields.join('')}
        screenshot(type: jpeg, quality: 30) {
          base64
        }
      }
    `

    const result = await this.executeQuery(query, variables)
    
    const bioTexts: string[] = []
    selectors.forEach((_, index) => {
      const text = result.data?.[`bio${index}`]?.text
      if (text && text.trim()) {
        bioTexts.push(text.trim())
      }
    })

    return {
      bioTexts,
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
