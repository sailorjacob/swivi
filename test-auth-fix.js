// Test script to verify authentication fixes
// Using dynamic import for ES modules
import('node-fetch').then(({ default: fetch }) => {

async function testAuthFlow() {
  console.log('🧪 Testing authentication flow...');

  try {
    // Test 1: Check if API routes are accessible without authentication (should return 401)
    console.log('\n1️⃣ Testing API routes without authentication...');

    const profileResponse = await fetch('http://localhost:3000/api/user/profile');
    console.log(`Profile API status: ${profileResponse.status}`);
    if (profileResponse.status !== 401) {
      console.log('❌ Profile API should return 401 for unauthenticated requests');
    } else {
      console.log('✅ Profile API correctly returns 401 for unauthenticated requests');
    }

    const dashboardResponse = await fetch('http://localhost:3000/api/clippers/dashboard');
    console.log(`Dashboard API status: ${dashboardResponse.status}`);
    if (dashboardResponse.status !== 401) {
      console.log('❌ Dashboard API should return 401 for unauthenticated requests');
    } else {
      console.log('✅ Dashboard API correctly returns 401 for unauthenticated requests');
    }

    // Test 2: Check if health endpoint works
    console.log('\n2️⃣ Testing health endpoint...');

    const healthResponse = await fetch('http://localhost:3000/api/health');
    console.log(`Health API status: ${healthResponse.status}`);
    if (healthResponse.status === 200) {
      console.log('✅ Health endpoint is accessible');
    } else {
      console.log('❌ Health endpoint should be accessible');
    }

    console.log('\n🎉 Authentication flow test completed!');
    console.log('If you see ✅ for all tests above, the authentication fixes are working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('Make sure the development server is running with: npm run dev');
  }
}

testAuthFlow();

}).catch(error => {
  console.error('Failed to load node-fetch:', error.message);
});
