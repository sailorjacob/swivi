import fetch from 'node-fetch';

async function testApifyInstagram(username) {
  try {
    const APIFY_API_KEY = process.env.APIFY_API_KEY;

    if (!APIFY_API_KEY) {
      console.log('❌ APIFY_API_KEY not set in environment variables');
      console.log('Please add APIFY_API_KEY to your .env file');
      return;
    }

    console.log(`🔍 Testing Apify Instagram scraping for @${username}...`);

    // Step 1: Start the Instagram scraper run
    const runResponse = await fetch('https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_API_KEY}`
      },
      body: JSON.stringify({
        "profileUrl": `https://www.instagram.com/${username}/`,
        "resultsPerPage": 1,
        "shouldDownloadCovers": false,
        "shouldDownloadSlideshowImages": false,
        "shouldDownloadVideos": false
      })
    });

    if (!runResponse.ok) {
      console.log(`❌ Apify run creation failed: ${runResponse.status} ${runResponse.statusText}`);
      if (runResponse.status === 401) {
        console.log('❌ Invalid API key - check your APIFY_API_KEY');
      }
      return;
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    const datasetId = runData.data.defaultDatasetId;

    console.log(`✅ Apify run started: ${runId}`);

    // Step 2: Wait for completion (with timeout)
    const maxWaitTime = 30000; // 30 seconds for testing
    const checkInterval = 2000; // 2 seconds
    let elapsed = 0;

    while (elapsed < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      elapsed += checkInterval;

      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${APIFY_API_KEY}`
        }
      });

      if (!statusResponse.ok) {
        console.log(`❌ Failed to check run status: ${statusResponse.status}`);
        break;
      }

      const statusData = await statusResponse.json();
      const runStatus = statusData.data.status;

      console.log(`🔄 Run status: ${runStatus} (${Math.round(elapsed/1000)}s)`);

      if (runStatus === 'SUCCEEDED') {
        // Step 3: Get the results
        const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?limit=1`, {
          headers: {
            'Authorization': `Bearer ${APIFY_API_KEY}`
          }
        });

        if (!resultsResponse.ok) {
          console.log(`❌ Failed to get results: ${resultsResponse.status}`);
          return;
        }

        const resultsData = await resultsResponse.json();

        if (!resultsData || resultsData.length === 0) {
          console.log(`❌ No profile data returned from Apify for: ${username}`);
          return;
        }

        const profile = resultsData[0];
        console.log('✅ Successfully retrieved profile data:');
        console.log(`   Username: ${profile.username || 'N/A'}`);
        console.log(`   Full Name: ${profile.fullName || 'N/A'}`);
        console.log(`   Bio: ${profile.biography || 'N/A'}`);
        console.log(`   Followers: ${profile.followersCount || 'N/A'}`);
        console.log(`   Following: ${profile.followsCount || 'N/A'}`);
        console.log(`   Posts: ${profile.postsCount || 'N/A'}`);

        if (profile.biography) {
          console.log('✅ Bio extraction successful!');
          console.log(`📝 Bio preview: "${profile.biography.substring(0, 100)}${profile.biography.length > 100 ? '...' : ''}"`);
        } else {
          console.log('❌ No bio found in profile data');
          console.log('Available fields:', Object.keys(profile));
        }

        return;
      } else if (runStatus === 'FAILED' || runStatus === 'ABORTED' || runStatus === 'TIMED-OUT') {
        console.log(`❌ Apify run failed with status: ${runStatus}`);
        break;
      }
    }

    console.log(`❌ Test timed out after ${maxWaitTime/1000} seconds`);

  } catch (error) {
    console.error(`❌ Error testing Apify Instagram scraping:`, error.message);
  }
}

// Test with a known public Instagram account
const testUsername = process.argv[2] || 'instagram';
testApifyInstagram(testUsername);
