import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

async function testApifyInstagram(username) {
  try {
    const APIFY_API_KEY = process.env.APIFY_API_KEY;

    if (!APIFY_API_KEY) {
      console.log('❌ APIFY_API_KEY not set in environment variables');
      console.log('Please add APIFY_API_KEY to your .env file');
      return;
    }

    console.log(`🔍 Testing Apify Instagram scraping for @${username}...`);
    console.log(`🔑 Using API key: ${APIFY_API_KEY.substring(0, 20)}...`);

    // First, test if the API key is valid by checking user info
    console.log('🔍 Testing API key validity...');
    const testResponse = await fetch('https://api.apify.com/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${APIFY_API_KEY}`
      }
    });

    if (!testResponse.ok) {
      console.log(`❌ API key test failed: ${testResponse.status} ${testResponse.statusText}`);
      return;
    }

    console.log('✅ API key is valid!');

    // Check available actors first
    console.log('🔍 Checking available actors...');
    const actorsResponse = await fetch('https://api.apify.com/v2/actors', {
      headers: {
        'Authorization': `Bearer ${APIFY_API_KEY}`
      }
    });

    if (actorsResponse.ok) {
      const actorsData = await actorsResponse.json();
      console.log(`📋 Total actors in account: ${actorsData.data.items.length}`);
      const instagramActors = actorsData.data.items.filter(actor =>
        actor.name.toLowerCase().includes('instagram') ||
        actor.title.toLowerCase().includes('instagram')
      );
      console.log('📋 Instagram-related actors:', instagramActors.map(a => `${a.name} - ${a.title}`));

      if (instagramActors.length === 0) {
        console.log('❌ No Instagram actors found in your account');
        console.log('💡 You may need to install or create an Instagram scraper actor first');
      }
    }

    // Try different actor name formats
    const actorNames = [
      'apify~instagram-profile-scraper', // This one works!
      'apify/instagram-profile-scraper',
      'w3lvTqHKIfxFIS9oo/instagram-profile-scraper',
      'instagram-profile-scraper',
      'instagram-scraper',
      'instagram-profile'
    ];

    let runResponse;
    let actorName = '';

    for (const name of actorNames) {
      console.log(`🔄 Trying actor: ${name}`);
      try {
        runResponse = await fetch(`https://api.apify.com/v2/acts/${name}/runs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${APIFY_API_KEY}`
          },
          body: JSON.stringify({
            "usernames": [username],
            "resultsPerPage": 1,
            "shouldDownloadCovers": false,
            "shouldDownloadSlideshowImages": false,
            "shouldDownloadVideos": false
          })
        });

        if (runResponse.ok) {
          actorName = name;
          break;
        } else {
          console.log(`❌ Failed with ${name}: ${runResponse.status} ${runResponse.statusText}`);
          try {
            const errorText = await runResponse.text();
            console.log(`Error: ${errorText}`);
          } catch (e) {
            console.log('Could not read error response');
          }
        }
      } catch (error) {
        console.log(`❌ Error with ${name}: ${error.message}`);
      }
    }

    if (!runResponse || !runResponse.ok) {
      console.log('❌ Could not find a working Instagram scraper actor');
      return;
    }

    console.log(`✅ Successfully started run with actor: ${actorName}`);

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
