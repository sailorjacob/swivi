// Test API endpoint functionality
const http = require('http')

async function testAPIEndpoint() {
  try {
    console.log('🔍 Testing API endpoint functionality...')

    // Test the health endpoint
    const healthResponse = await makeRequest('GET', '/api/health')
    console.log('✅ Health endpoint:', healthResponse.statusCode === 200 ? 'OK' : 'FAILED')

    // Test profile endpoint (will fail without auth, but should return proper error)
    const profileResponse = await makeRequest('GET', '/api/user/profile')
    console.log('✅ Profile endpoint (no auth):', profileResponse.statusCode === 401 ? 'OK (Unauthorized as expected)' : 'UNEXPECTED')

    console.log('🎉 API endpoint test completed!')
  } catch (error) {
    console.error('❌ API endpoint test failed!')
    console.error('Error:', error.message)
  }
}

function makeRequest(method, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data
        })
      })
    })

    req.on('error', (err) => {
      reject(err)
    })

    req.end()
  })
}

testAPIEndpoint()
