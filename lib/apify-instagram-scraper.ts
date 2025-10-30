interface InstagramScrapeResult {
  inputUrl: string
  id: string
  type: string
  shortCode: string
  caption: string
  hashtags: string[]
  mentions: string[]
  url: string
  commentsCount: number
  likesCount: number
  videoViewCount?: number
  videoPlayCount?: number
  dimensionsHeight: number
  dimensionsWidth: number
  displayUrl: string
  videoUrl?: string
  timestamp: string
  ownerFullName: string
  ownerUsername: string
  ownerId: string
  productType: string
  videoDuration?: number
  isSponsored: boolean
}

interface ApifyResponse {
  data: {
    id: string
    status: string
    defaultDatasetId: string
    errorMessage?: string
  }
}

interface ApifyDatasetItem {
  pageFunctionResult: InstagramScrapeResult[]
}

export class ApifyInstagramScraper {
  private apiToken: string
  private baseUrl = 'https://api.apify.com/v2'
  private actorName = 'apify~instagram-scraper' // Fixed: Use tilde instead of slash

  constructor(apiToken: string) {
    this.apiToken = apiToken
  }

  /**
   * Scrapes Instagram post data using Apify
   * @param postUrl - Instagram post URL to scrape
   * @returns Promise with Instagram post data
   */
  async scrapeInstagramPost(postUrl: string): Promise<InstagramScrapeResult | null> {
    try {
      // Use waitForFinish parameter to avoid polling - Apify holds connection until done
      // Increased to 240s (4min) to handle slow Instagram scrapes, still under Vercel's 5min limit
      const runResponse = await fetch(`${this.baseUrl}/acts/${this.actorName}/runs?waitForFinish=240`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify({
          addParentData: false,
          directUrls: [postUrl],
          enhanceUserSearchWithFacebookPage: false,
          isUserReelFeedURL: false,
          isUserTaggedFeedURL: false,
          resultsLimit: 200,
          resultsType: "posts",
          searchLimit: 1,
          searchType: "hashtag"
        }),
      })

      if (!runResponse.ok) {
        let errorText = ''
        try {
          errorText = await runResponse.text()
        } catch (e) {
          errorText = 'Unable to read error response'
        }
        throw new Error(`Apify API error: ${runResponse.status} ${errorText}`)
      }

      const runData: ApifyResponse = await runResponse.json()
      
      // Check if run succeeded
      if (runData.data.status === 'FAILED') {
        throw new Error(`Apify run failed: ${runData.data.errorMessage || 'Unknown error'}`)
      } else if (runData.data.status === 'READY' || runData.data.status === 'RUNNING') {
        throw new Error(`Apify run timed out (still ${runData.data.status.toLowerCase()}) - will retry next cron run`)
      } else if (runData.data.status !== 'SUCCEEDED') {
        throw new Error(`Apify run ended with unexpected status: ${runData.data.status}`)
      }

      // Get the dataset ID and fetch results
      const datasetId = runData.data.defaultDatasetId

      const datasetResponse = await fetch(`${this.baseUrl}/datasets/${datasetId}/items`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      })

      if (!datasetResponse.ok) {
        throw new Error(`Failed to fetch dataset: ${datasetResponse.status}`)
      }

      const datasetItems: InstagramScrapeResult[] = await datasetResponse.json()

      // Extract the first result (should be the only one based on our configuration)
      const result = datasetItems[0]

      if (!result) {
        throw new Error('No data returned from Apify scraper')
      }

      return result

    } catch (error) {
      console.error('Error scraping Instagram post:', error)
      throw error
    }
  }

  /**
   * Scrapes multiple Instagram posts concurrently
   * @param postUrls - Array of Instagram post URLs to scrape
   * @returns Promise with array of Instagram post data
   */
  async scrapeMultipleInstagramPosts(postUrls: string[]): Promise<(InstagramScrapeResult | null)[]> {
    const promises = postUrls.map(url => this.scrapeInstagramPost(url))
    return Promise.allSettled(promises).then(results =>
      results.map(result =>
        result.status === 'fulfilled' ? result.value : null
      )
    )
  }
}
