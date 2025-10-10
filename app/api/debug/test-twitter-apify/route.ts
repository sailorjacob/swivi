import { NextRequest, NextResponse } from "next/server"

// Twitter/X bio checking via Apify (fastcrawler/twitter-user-profile-fast-cheapest-scraper-2025)
async function testTwitterApify(username: string, code: string): Promise<any> {
  const logs: string[] = []
  
  try {
    const APIFY_API_KEY = process.env.APIFY_API_KEY
    logs.push(`🔑 Apify API Key check: ${!!APIFY_API_KEY ? 'present' : 'missing'}`)
    
    if (!APIFY_API_KEY) {
      logs.push('❌ APIFY_API_KEY not configured for Twitter/X')
      return { success: false, logs, error: 'No API key' }
    }

    logs.push(`🔍 Checking Twitter/X profile via Apify: @${username}`)
    logs.push(`🔍 Looking for code: "${code}"`)

    // Use fastcrawler/twitter-user-profile-fast-cheapest-scraper-2025
    const requestBody = {
      "queryUser": [username],
      "shouldIncludeUserById": true,
      "shouldIncludeUserByScreenName": true,
      "maxItems": 1
    }
    logs.push(`📤 Apify request body: ${JSON.stringify(requestBody, null, 2)}`)

    const runResponse = await fetch('https://api.apify.com/v2/acts/fastcrawler~twitter-user-profile-fast-cheapest-scraper-2025/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    })

    logs.push(`📊 Apify run response: ${runResponse.status} ${runResponse.statusText}`)

    if (!runResponse.ok) {
      const errorText = await runResponse.text()
      logs.push(`❌ Twitter Apify run failed: ${runResponse.status} - ${errorText}`)
      return { success: false, logs, error: `Apify run failed: ${runResponse.status}`, errorDetails: errorText }
    }

    const runData = await runResponse.json()
    const runId = runData.data.id
    const datasetId = runData.data.defaultDatasetId
    
    logs.push(`✅ Twitter Apify run started: runId=${runId}, datasetId=${datasetId}`)

    // Wait for completion (shorter timeout for testing)
    const maxWaitTime = 30000 // 30 seconds for testing
    const checkInterval = 2000
    let elapsed = 0

    while (elapsed < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval))
      elapsed += checkInterval

      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: { 'Authorization': `Bearer ${APIFY_API_KEY}` }
      })

      if (!statusResponse.ok) {
        logs.push(`❌ Failed to check run status: ${statusResponse.status}`)
        break
      }

      const statusData = await statusResponse.json()
      const runStatus = statusData.data.status
      
      logs.push(`🔄 Twitter run status: ${runStatus} (${Math.round(elapsed/1000)}s elapsed)`)

      if (runStatus === 'SUCCEEDED') {
        logs.push(`✅ Twitter run completed successfully!`)
        
        const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?limit=10`, {
          headers: { 'Authorization': `Bearer ${APIFY_API_KEY}` }
        })

        if (!resultsResponse.ok) {
          logs.push(`❌ Failed to get results: ${resultsResponse.status}`)
          return { success: false, logs, error: 'Failed to get results' }
        }

        const resultsData = await resultsResponse.json()
        logs.push(`📊 Results count: ${resultsData.length}`)

        if (!resultsData || resultsData.length === 0) {
          logs.push(`❌ No profile data returned from Apify for: ${username}`)
          return { success: false, logs, error: 'No profile data' }
        }

        // Check multiple profiles if returned
        for (const profile of resultsData) {
          const usernameMatch = profile.username === username || profile.screenName === username
          logs.push(`🔍 Profile check: username=${profile.username}, screenName=${profile.screenName}, match=${usernameMatch}`)
          
          if (usernameMatch) {
            const description = profile.description || profile.bio || ''
            logs.push(`📝 Bio found: "${description.substring(0, 100)}${description.length > 100 ? '...' : ''}"`)

            if (!description) {
              logs.push(`❌ No description found in Twitter data for: ${username}`)
              continue
            }

            const codeFound = description.includes(code)
            logs.push(`🔍 Code search result: ${codeFound ? '✅ FOUND' : '❌ NOT FOUND'}`)

            return { 
              success: true, 
              logs, 
              codeFound, 
              bio: description,
              profile: {
                username: profile.username,
                screenName: profile.screenName,
                description: description
              }
            }
          }
        }

        logs.push(`❌ No matching Twitter profile found for: ${username}`)
        return { success: false, logs, error: 'No matching profile' }

      } else if (runStatus === 'FAILED' || runStatus === 'ABORTED' || runStatus === 'TIMED-OUT') {
        logs.push(`❌ Twitter Apify run failed with status: ${runStatus}`)
        return { success: false, logs, error: `Run failed: ${runStatus}` }
      }
    }

    logs.push(`❌ Twitter Apify run timed out after ${maxWaitTime/1000} seconds`)
    return { success: false, logs, error: 'Timeout' }

  } catch (error) {
    logs.push(`❌ Twitter bio check failed for ${username}: ${error.message}`)
    return { success: false, logs, error: error.message }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, code } = await request.json()
    
    if (!username || !code) {
      return NextResponse.json({
        success: false,
        error: "Missing username or code"
      }, { status: 400 })
    }

    console.log(`🧪 Testing Twitter Apify for @${username} with code "${code}"`)
    
    const result = await testTwitterApify(username, code)
    
    return NextResponse.json({
      success: result.success,
      username,
      code,
      ...result
    })

  } catch (error) {
    console.error('Twitter Apify test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
