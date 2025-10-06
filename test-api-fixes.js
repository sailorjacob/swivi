// Test script to verify our API fixes work correctly
const http = require('http')

async function testAPIs() {
  console.log('🔍 Testing API fixes...')

  const baseUrl = 'http://localhost:3000'

  try {
    // Test 1: Check if the server is running
    console.log('📡 Testing server connectivity...')
    await makeRequest(`${baseUrl}/api/health`)

    // Test 2: Test profile API (should return 401 without auth)
    console.log('🔐 Testing profile API without auth...')
    try {
      await makeRequest(`${baseUrl}/api/user/profile`)
      console.log('❌ Expected 401 but got success')
    } catch (error) {
      if (error.status === 401) {
        console.log('✅ Profile API correctly returns 401 without auth')
      } else {
        console.log('❌ Profile API returned unexpected status:', error.status)
      }
    }

    // Test 3: Test connected accounts API (should return 401 without auth)
    console.log('🔗 Testing connected accounts API without auth...')
    try {
      await makeRequest(`${baseUrl}/api/user/connected-accounts`)
      console.log('❌ Expected 401 but got success')
    } catch (error) {
      if (error.status === 401) {
        console.log('✅ Connected accounts API correctly returns 401 without auth')
      } else {
        console.log('❌ Connected accounts API returned unexpected status:', error.status)
      }
    }

    // Test 4: Test dashboard API (should return 401 without auth)
    console.log('📊 Testing dashboard API without auth...')
    try {
      await makeRequest(`${baseUrl}/api/clippers/dashboard`)
      console.log('❌ Expected 401 but got success')
    } catch (error) {
      if (error.status === 401) {
        console.log('✅ Dashboard API correctly returns 401 without auth')
      } else {
        console.log('❌ Dashboard API returned unexpected status:', error.status)
      }
    }

    console.log('🎉 API authentication tests completed!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, data: JSON.parse(data) })
        } else {
          reject({ status: res.statusCode, data })
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.end()
  })
}

testAPIs()
