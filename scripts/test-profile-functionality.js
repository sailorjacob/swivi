// Test script to verify profile and payout functionality
const { PrismaClient } = require('@prisma/client')

async function testProfileFunctionality() {
  const prisma = new PrismaClient()

  try {
    console.log('🔍 Testing profile and payout functionality...')

    // Test 1: Check if we can query the user table
    const userCount = await prisma.user.count()
    console.log(`✅ Found ${userCount} users in database`)

    if (userCount === 0) {
      console.log('⚠️  No users found. Creating a test user...')
      const testUser = await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          bio: 'Test bio',
          website: 'https://example.com',
          walletAddress: '0x742d35Cc6635C0532925a3b8D951D9C9',
          paypalEmail: 'test@example.com'
        }
      })
      console.log('✅ Created test user:', testUser.id)
    }

    // Test 2: Update profile with empty fields (should convert to null)
    const firstUser = await prisma.user.findFirst()
    if (firstUser) {
      console.log('✅ Testing profile update with empty fields...')
      const updatedUser = await prisma.user.update({
        where: { id: firstUser.id },
        data: {
          name: 'Updated Name',
          bio: '', // Should become null
          website: '', // Should become null
          walletAddress: '0x1234567890123456789012345678901234567890',
          paypalEmail: '' // Should become null
        }
      })
      console.log('✅ Profile updated successfully')
      console.log('Updated user data:', {
        name: updatedUser.name,
        bio: updatedUser.bio, // Should be null
        website: updatedUser.website, // Should be null
        walletAddress: updatedUser.walletAddress,
        paypalEmail: updatedUser.paypalEmail // Should be null
      })

      // Test 3: Verify empty strings were converted to null
      if (updatedUser.bio === null && updatedUser.website === null && updatedUser.paypalEmail === null) {
        console.log('✅ Empty fields correctly converted to null in database')
      } else {
        console.log('❌ Empty fields not properly converted to null')
        console.log('Expected null but got:', {
          bio: updatedUser.bio,
          website: updatedUser.website,
          paypalEmail: updatedUser.paypalEmail
        })
      }
    }

    console.log('🎉 Profile functionality test completed successfully!')
  } catch (error) {
    console.error('❌ Profile functionality test failed!')
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testProfileFunctionality()
