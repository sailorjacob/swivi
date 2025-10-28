interface YouTubeScrapeResult {
  title: string
  id: string
  url: string
  viewCount: number
  date: string
  likes: number
  channelName: string
  channelUrl: string
  numberOfSubscribers: number
  duration: string
}

interface ApifyResponse {
  data: {
    id: string
  }
}

interface ApifyDatasetItem {
  pageFunctionResult: YouTubeScrapeResult[]
}

export class ApifyYouTubeScraper {
  private apiToken: string
  private baseUrl = 'https://api.apify.com/v2'
  private actorName = 'streamers/youtube-shorts-scraper'

  constructor(apiToken: string) {
    this.apiToken = apiToken
  }

  /**
   * Scrapes YouTube video data using Apify
   * @param videoUrl - YouTube video URL to scrape
   * @returns Promise with YouTube video data
   */
  async scrapeYouTubeVideo(videoUrl: string): Promise<YouTubeScrapeResult | null> {
    try {
      // Step 1: Start the Apify actor run
      // TODO: Replace 'youtube-scraper-placeholder' with actual actor name
      const runResponse = await fetch(`${this.baseUrl}/acts/${this.actorName}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify({
          channels: [videoUrl],
          maxResultsShorts: 1
        }),
      })

      if (!runResponse.ok) {
        const error = await runResponse.text()
        throw new Error(`Apify API error: ${runResponse.status} ${error}`)
      }

      const runData: ApifyResponse = await runResponse.json()
      const runId = runData.data.id

      // Step 2: Poll for completion
      let attempts = 0
      const maxAttempts = 30 // 30 seconds max wait
      let lastStatusResponse: Response | null = null

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second

        const statusResponse = await fetch(`${this.baseUrl}/actor-runs/${runId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
          },
        })

        lastStatusResponse = statusResponse

        if (!statusResponse.ok) {
          throw new Error(`Failed to check run status: ${statusResponse.status}`)
        }

        const statusData = await statusResponse.json()

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

      if (!lastStatusResponse) {
        throw new Error('No status response received')
      }

      // Step 3: Get the dataset ID and fetch results
      const statusData = await lastStatusResponse.json()
      const datasetId = statusData.data.defaultDatasetId

      const datasetResponse = await fetch(`${this.baseUrl}/datasets/${datasetId}/items`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      })

      if (!datasetResponse.ok) {
        throw new Error(`Failed to fetch dataset: ${datasetResponse.status}`)
      }

      const datasetItems: YouTubeScrapeResult[] = await datasetResponse.json()

      // Extract the first result (should be the only one based on our configuration)
      const result = datasetItems[0]

      if (!result) {
        throw new Error('No data returned from Apify scraper')
      }

      return result

    } catch (error) {
      console.error('Error scraping YouTube video:', error)
      throw error
    }
  }

  /**
   * Scrapes multiple YouTube videos concurrently
   * @param videoUrls - Array of YouTube video URLs to scrape
   * @returns Promise with array of YouTube video data
   */
  async scrapeMultipleYouTubeVideos(videoUrls: string[]): Promise<(YouTubeScrapeResult | null)[]> {
    const promises = videoUrls.map(url => this.scrapeYouTubeVideo(url))
    return Promise.allSettled(promises).then(results =>
      results.map(result =>
        result.status === 'fulfilled' ? result.value : null
      )
    )
  }
}
