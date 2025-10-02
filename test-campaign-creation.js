// Simple test script to verify campaign creation API
const testCampaignCreation = async () => {
  try {
    console.log('Testing campaign creation API...')

    const testCampaign = {
      title: "Test Campaign",
      description: "This is a test campaign to verify the API works",
      creator: "Test Brand",
      budget: 1000,
      minPayout: 0.50,
      maxPayout: 5.00,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      targetPlatforms: ["TIKTOK", "INSTAGRAM"],
      requirements: ["Create engaging content", "Follow brand guidelines"],
      status: "ACTIVE"
    }

    const response = await fetch('http://localhost:3000/api/campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCampaign)
    })

    console.log('Response status:', response.status)
    const data = await response.json()
    console.log('Response data:', data)

    if (response.ok) {
      console.log('✅ Campaign creation successful!')
      return data
    } else {
      console.log('❌ Campaign creation failed:', data)
      return null
    }
  } catch (error) {
    console.error('❌ Error testing campaign creation:', error)
    return null
  }
}

// Test fetching campaigns
const testCampaignFetching = async () => {
  try {
    console.log('Testing campaign fetching API...')

    const response = await fetch('http://localhost:3000/api/clippers/campaigns')
    console.log('Response status:', response.status)

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Campaign fetching successful!')
      console.log('Found campaigns:', data.length)
      return data
    } else {
      console.log('❌ Campaign fetching failed')
      return null
    }
  } catch (error) {
    console.error('❌ Error testing campaign fetching:', error)
    return null
  }
}

// Run tests
const runTests = async () => {
  console.log('Starting campaign API tests...\n')

  // First test fetching campaigns
  const campaigns = await testCampaignFetching()
  console.log('\n---\n')

  // Then test creating a campaign (you might need to be authenticated)
  const newCampaign = await testCampaignCreation()
  console.log('\n---\n')

  if (newCampaign) {
    console.log('✅ All tests passed!')
  } else {
    console.log('❌ Some tests failed')
  }
}

runTests()
