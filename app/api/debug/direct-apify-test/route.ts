// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { username, code } = await request.json()
    
    if (!username) {
      return NextResponse.json({
        success: false,
        error: "Username is required"
      }, { status: 400 })
    }

    const logs: string[] = []
    const APIFY_API_KEY = process.env.APIFY_API_KEY
    
    logs.push(`🔑 API Key check: ${!!APIFY_API_KEY ? 'present' : 'missing'}`)
    logs.push(`🔑 API Key length: ${APIFY_API_KEY?.length || 0}`)
    logs.push(`🔑 API Key preview: ${APIFY_API_KEY ? `${APIFY_API_KEY.substring(0, 12)}...` : 'none'}`)
    
    if (!APIFY_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "APIFY_API_KEY not configured",
        logs
      }, { status: 500 })
    }

    // Test 1: Check if we can access the actor info
    logs.push(`📋 Step 1: Checking actor info...`)
    try {
      const actorInfoResponse = await fetch('https://api.apify.com/v2/acts/fastcrawler~twitter-user-profile-fast-cheapest-scraper-2025', {
        headers: {
          'Authorization': `Bearer ${APIFY_API_KEY}`
        }
      })
      
      logs.push(`📊 Actor info response: ${actorInfoResponse.status} ${actorInfoResponse.statusText}`)
      
      if (actorInfoResponse.ok) {
        const actorInfo = await actorInfoResponse.json()
        logs.push(`✅ Actor accessible: ${actorInfo.data?.name || 'unknown'}`)
        logs.push(`📋 Actor status: ${actorInfo.data?.stats?.totalRuns || 0} total runs`)
      } else {
        const errorText = await actorInfoResponse.text()
        logs.push(`❌ Actor info failed: ${errorText}`)
      }
    } catch (error) {
      logs.push(`❌ Actor info error: ${error.message}`)
    }

    // Test 2: Try to start a run
    logs.push(`🚀 Step 2: Starting actor run...`)
    const requestBody = {
      "queryUser": [username],
      "shouldIncludeUserById": true,
      "shouldIncludeUserByScreenName": true,
      "maxItems": 1
    }
    
    logs.push(`📤 Request body: ${JSON.stringify(requestBody, null, 2)}`)
    
    const runResponse = await fetch('https://api.apify.com/v2/acts/fastcrawler~twitter-user-profile-fast-cheapest-scraper-2025/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    })

    logs.push(`📊 Run response: ${runResponse.status} ${runResponse.statusText}`)
    logs.push(`📊 Run headers: ${JSON.stringify(Object.fromEntries(runResponse.headers.entries()), null, 2)}`)

    if (!runResponse.ok) {
      const errorText = await runResponse.text()
      logs.push(`❌ Run failed: ${errorText}`)
      
      return NextResponse.json({
        success: false,
        error: `Run failed: ${runResponse.status} ${runResponse.statusText}`,
        errorDetails: errorText,
        logs
      }, { status: 500 })
    }

    const runData = await runResponse.json()
    logs.push(`✅ Run started successfully!`)
    logs.push(`📋 Run ID: ${runData.data?.id}`)
    logs.push(`📋 Dataset ID: ${runData.data?.defaultDatasetId}`)
    logs.push(`📋 Status: ${runData.data?.status}`)
    logs.push(`📋 Full run data: ${JSON.stringify(runData, null, 2)}`)

    const runId = runData.data.id
    const datasetId = runData.data.defaultDatasetId

    // Test 3: Monitor the run
    logs.push(`⏱️ Step 3: Monitoring run progress...`)
    const maxWaitTime = 60000 // 60 seconds
    const checkInterval = 3000 // 3 seconds
    let elapsed = 0

    while (elapsed < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval))
      elapsed += checkInterval

      try {
        const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
          headers: { 'Authorization': `Bearer ${APIFY_API_KEY}` }
        })

        if (!statusResponse.ok) {
          logs.push(`❌ Status check failed: ${statusResponse.status}`)
          break
        }

        const statusData = await statusResponse.json()
        const runStatus = statusData.data.status
        
        logs.push(`🔄 Status: ${runStatus} (${Math.round(elapsed/1000)}s elapsed)`)
        logs.push(`📊 Stats: ${JSON.stringify(statusData.data.stats || {}, null, 2)}`)

        if (runStatus === 'SUCCEEDED') {
          logs.push(`✅ Run completed successfully!`)
          
          // Test 4: Get results
          logs.push(`📥 Step 4: Fetching results...`)
          const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?limit=5`, {
            headers: { 'Authorization': `Bearer ${APIFY_API_KEY}` }
          })

          if (!resultsResponse.ok) {
            logs.push(`❌ Results fetch failed: ${resultsResponse.status}`)
            break
          }

          const resultsData = await resultsResponse.json()
          logs.push(`📊 Results count: ${resultsData.length}`)
          
          if (resultsData.length > 0) {
            const profile = resultsData[0]
            logs.push(`👤 Profile found: @${profile.username || profile.screenName}`)
            logs.push(`📝 Description: "${(profile.description || profile.bio || '').substring(0, 200)}..."`)
            
            if (code) {
              const description = profile.description || profile.bio || ''
              const codeFound = description.includes(code)
              logs.push(`🔍 Code "${code}" found: ${codeFound ? '✅ YES' : '❌ NO'}`)
            }
            
            logs.push(`📋 Full profile: ${JSON.stringify(profile, null, 2)}`)
          } else {
            logs.push(`❌ No results returned`)
          }

          return NextResponse.json({
            success: true,
            runId,
            datasetId,
            results: resultsData,
            logs
          })

        } else if (runStatus === 'FAILED' || runStatus === 'ABORTED' || runStatus === 'TIMED-OUT') {
          logs.push(`❌ Run failed with status: ${runStatus}`)
          logs.push(`📋 Error details: ${JSON.stringify(statusData.data, null, 2)}`)
          break
        }
      } catch (statusError) {
        logs.push(`❌ Status check error: ${statusError.message}`)
        break
      }
    }

    if (elapsed >= maxWaitTime) {
      logs.push(`⏰ Run timed out after ${maxWaitTime/1000} seconds`)
    }

    return NextResponse.json({
      success: false,
      error: "Run did not complete successfully",
      runId,
      datasetId,
      logs
    })

  } catch (error) {
    console.error('Direct Apify test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      logs: [`❌ Error: ${error instanceof Error ? error.message : String(error)}`]
    }, { status: 500 })
  }
}
