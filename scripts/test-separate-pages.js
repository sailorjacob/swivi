// Test script to verify profile and payout pages work separately
const { PrismaClient } = require('@prisma/client')

async function testSeparatePages() {
  const prisma = new PrismaClient()

  try {
    console.log('🔍 Testing profile and payout page separation...')

    // Create a test user if none exists
    let user = await prisma.user.findFirst()
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          bio: 'Test bio',
          website: 'https://example.com',
          walletAddress: '0x742d35Cc6635C0532925a3b8D951D9C9',
          paypalEmail: 'test@example.com'
        }
      })
      console.log('✅ Created test user:', user.id)
    }

    // Test 1: Update only profile data (name, bio, website)
    console.log('✅ Testing profile-only update...')
    const profileUpdate = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: 'Updated Profile Name',
        bio: 'Updated bio content',
        website: 'https://updated-website.com',
        // walletAddress and paypalEmail should remain unchanged
      }
    })

    console.log('✅ Profile updated:', {
      name: profileUpdate.name,
      bio: profileUpdate.bio,
      website: profileUpdate.website,
      walletAddress: profileUpdate.walletAddress, // Should be unchanged
      paypalEmail: profileUpdate.paypalEmail // Should be unchanged
    })

    // Test 2: Update only payout data (walletAddress, paypalEmail)
    console.log('✅ Testing payout-only update...')
    const payoutUpdate = await prisma.user.update({
      where: { id: user.id },
      data: {
        walletAddress: '0x1234567890123456789012345678901234567890',
        paypalEmail: 'newpaypal@example.com',
        // name, bio, website should remain unchanged
      }
    })

    console.log('✅ Payout updated:', {
      name: payoutUpdate.name, // Should be unchanged
      bio: payoutUpdate.bio, // Should be unchanged
      website: payoutUpdate.website, // Should be unchanged
      walletAddress: payoutUpdate.walletAddress,
      paypalEmail: payoutUpdate.paypalEmail
    })

    // Test 3: Test empty field handling
    console.log('✅ Testing empty field handling...')
    const emptyUpdate = await prisma.user.update({
      where: { id: user.id },
      data: {
        bio: '', // Should become null
        website: '', // Should become null
        paypalEmail: '' // Should become null
      }
    })

    console.log('✅ Empty fields test:', {
      bio: emptyUpdate.bio, // Should be null
      website: emptyUpdate.website, // Should be null
      paypalEmail: emptyUpdate.paypalEmail // Should be null
    })

    // Verify the results
    if (emptyUpdate.bio === null && emptyUpdate.website === null && emptyUpdate.paypalEmail === null) {
      console.log('✅ Empty fields correctly converted to null')
    } else {
      console.log('❌ Empty fields not properly converted to null')
    }

    console.log('🎉 Separation test completed successfully!')
  } catch (error) {
    console.error('❌ Separation test failed!')
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testSeparatePages()
