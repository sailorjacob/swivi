interface TikTokScrapeResult {
  authorMeta: {
    avatar: string
    name: string
  }
  text: string
  diggCount: number
  shareCount: number
  playCount: number
  commentCount: number
  collectCount: number
  videoMeta: {
    duration: number
  }
  musicMeta: {
    musicName: string
    musicAuthor: string
    musicOriginal: boolean
  }
  createTimeISO: string
  webVideoUrl: string
}

interface ApifyResponse {
  data: {
    id: string
  }
}

interface ApifyDatasetItem {
  pageFunctionResult: TikTokScrapeResult[]
}

export class ApifyTikTokScraper {
  private apiToken: string
  private baseUrl = 'https://api.apify.com/v2'

  constructor(apiToken: string) {
    this.apiToken = apiToken
  }

  /**
   * Scrapes TikTok video data using Apify
   * @param postUrl - TikTok post URL to scrape
   * @returns Promise with TikTok video data
   */
  async scrapeTikTokVideo(postUrl: string): Promise<TikTokScrapeResult | null> {
    try {
      // Step 1: Start the Apify actor run
      const runResponse = await fetch(`${this.baseUrl}/acts/clockworks~tiktok-scraper/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify({
          excludePinnedPosts: false,
          postURLs: [postUrl],
          proxyCountryCode: "None",
          resultsPerPage: 1,
          scrapeRelatedVideos: false,
          shouldDownloadAvatars: false,
          shouldDownloadCovers: false,
          shouldDownloadMusicCovers: false,
          shouldDownloadSlideshowImages: false,
          shouldDownloadSubtitles: false,
          shouldDownloadVideos: false,
          profileScrapeSections: ["videos"],
          profileSorting: "latest",
          searchSection: "",
          maxProfilesPerQuery: 10
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
      const runId = runData.data.id

      // Step 2: Poll for completion
      let attempts = 0
      const maxAttempts = 180 // 180 seconds (3 min) max wait - Apify can be slow
      let lastStatusData: any = null

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second

        const statusResponse = await fetch(`${this.baseUrl}/actor-runs/${runId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
          },
        })

        if (!statusResponse.ok) {
          throw new Error(`Failed to check run status: ${statusResponse.status}`)
        }

        const statusData = await statusResponse.json()
        lastStatusData = statusData

        if (statusData.data.status === 'SUCCEEDED') {
          break
        } else if (statusData.data.status === 'FAILED') {
          throw new Error(`Apify run failed: ${statusData.data.errorMessage || 'Unknown error'}`)
        }

        attempts++
      }

      if (attempts >= maxAttempts) {
        throw new Error('Apify run timed out')
      }

      if (!lastStatusData) {
        throw new Error('No status data received')
      }

      // Step 3: Get the dataset ID and fetch results
      const datasetId = lastStatusData.data.defaultDatasetId

      const datasetResponse = await fetch(`${this.baseUrl}/datasets/${datasetId}/items`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      })

      if (!datasetResponse.ok) {
        throw new Error(`Failed to fetch dataset: ${datasetResponse.status}`)
      }

      const datasetItems: TikTokScrapeResult[] = await datasetResponse.json()

      // Extract the first result (should be the only one based on our configuration)
      const result = datasetItems[0]

      if (!result) {
        throw new Error('No data returned from Apify scraper')
      }

      return result

    } catch (error) {
      console.error('Error scraping TikTok video:', error)
      throw error
    }
  }

  /**
   * Scrapes multiple TikTok videos concurrently
   * @param postUrls - Array of TikTok post URLs to scrape
   * @returns Promise with array of TikTok video data
   */
  async scrapeMultipleTikTokVideos(postUrls: string[]): Promise<(TikTokScrapeResult | null)[]> {
    const promises = postUrls.map(url => this.scrapeTikTokVideo(url))
    return Promise.allSettled(promises).then(results =>
      results.map(result =>
        result.status === 'fulfilled' ? result.value : null
      )
    )
  }
}
