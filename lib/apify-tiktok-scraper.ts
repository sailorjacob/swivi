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
    status: string
    defaultDatasetId: string
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
      // Use waitForFinish parameter to avoid polling - Apify holds connection until done
      const runResponse = await fetch(`${this.baseUrl}/acts/clockworks~tiktok-scraper/runs?waitForFinish=120`, {
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
      
      // Check if run succeeded
      if (runData.data.status !== 'SUCCEEDED') {
        throw new Error(`Apify run failed with status: ${runData.data.status}`)
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
