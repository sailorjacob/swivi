// Test script to debug admin users API issues
const testAdminUsersAPI = async () => {
  try {
    console.log('Testing admin users API...')

    // Test basic endpoint
    const response = await fetch('http://localhost:3000/api/admin/users', {
      headers: {
        'Content-Type': 'application/json',
      }
    })

    console.log('Response status:', response.status)
    const data = await response.json()
    console.log('Response data:', data)

    if (response.ok) {
      console.log('✅ Admin users API working!')
      return data
    } else {
      console.log('❌ Admin users API failed:', data)
      return null
    }
  } catch (error) {
    console.error('❌ Error testing admin users API:', error.message)
    return null
  }
}

// Test role filtering
const testRoleFiltering = async () => {
  try {
    console.log('Testing role filtering...')

    const response = await fetch('http://localhost:3000/api/admin/users?role=CLIPPER', {
      headers: {
        'Content-Type': 'application/json',
      }
    })

    console.log('Response status:', response.status)
    const data = await response.json()
    console.log('Response data:', data)

    if (response.ok) {
      console.log('✅ Role filtering working!')
      return data
    } else {
      console.log('❌ Role filtering failed:', data)
      return null
    }
  } catch (error) {
    console.error('❌ Error testing role filtering:', error.message)
    return null
  }
}

// Run tests
const runTests = async () => {
  console.log('Starting admin users API tests...\n')

  // Test basic functionality
  const basicTest = await testAdminUsersAPI()
  console.log('\n---\n')

  // Test role filtering
  const roleTest = await testRoleFiltering()
  console.log('\n---\n')

  if (basicTest && roleTest) {
    console.log('✅ All tests passed!')
  } else {
    console.log('❌ Some tests failed')
  }
}

runTests()
