#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Complete content from the Owning Manhattan case study with accurate data
const sampleSubmissions = [
  { url: "https://www.youtube.com/watch?v=aYvYBL2oKdo", platform: "YOUTUBE", views: 6 },
  { url: "https://www.tiktok.com/@cardiofieldera/video/7545557577111702797", platform: "TIKTOK", views: 7 },
  { url: "https://www.youtube.com/watch?v=O_XjYf06WJg", platform: "YOUTUBE", views: 13 },
  { url: "https://www.tiktok.com/@cardiofieldera/video/7545556429323635981", platform: "TIKTOK", views: 21 },
  { url: "https://www.tiktok.com/@rockyclipper/video/7545559045055319351", platform: "TIKTOK", views: 67 },
  { url: "https://www.tiktok.com/@cardiofieldera/video/7545173627235355917", platform: "TIKTOK", views: 99 },
  { url: "https://www.youtube.com/watch?v=PeLmYsFLUqQ", platform: "YOUTUBE", views: 107 },
  { url: "https://www.youtube.com/watch?v=9iLxibl2qRM", platform: "YOUTUBE", views: 118 },
  { url: "https://www.tiktok.com/@cardiofieldera/video/7545174662817254711", platform: "TIKTOK", views: 124 },
  { url: "https://www.instagram.com/reel/DOHZq1vkuWp", platform: "INSTAGRAM", views: 590 },
  { url: "https://www.instagram.com/reel/DOIEOqhiJpg", platform: "INSTAGRAM", views: 612 },
  { url: "https://www.instagram.com/reel/DOIxEqlEmpf", platform: "INSTAGRAM", views: 790 },
  { url: "https://www.instagram.com/reel/DOJqYTWkt9b", platform: "INSTAGRAM", views: 743 },
  { url: "https://www.tiktok.com/@rockyclipper/video/7545176440715627789", platform: "TIKTOK", views: 1288 },
  { url: "https://www.youtube.com/watch?v=Rp96Nn90wIc", platform: "YOUTUBE", views: 1277 },
  { url: "https://www.youtube.com/watch?v=1_hbODOOrFU", platform: "YOUTUBE", views: 1344 },
  { url: "https://www.instagram.com/reel/DODDNNMj3IU", platform: "INSTAGRAM", views: 1570 },
  { url: "https://www.youtube.com/watch?v=8nfwDJrdY5Y", platform: "YOUTUBE", views: 1567 },
  { url: "https://www.youtube.com/watch?v=rkQLMHrqoLw", platform: "YOUTUBE", views: 1584 },
  { url: "https://www.youtube.com/watch?v=Q9_8FtQ5Fys", platform: "YOUTUBE", views: 1662 },
  { url: "https://www.youtube.com/watch?v=kuIHpICM_P4", platform: "YOUTUBE", views: 1692 },
  { url: "https://www.youtube.com/watch?v=7PwxMevJwRw", platform: "YOUTUBE", views: 2258 },
  { url: "https://www.youtube.com/watch?v=nUR2hG9iA54", platform: "YOUTUBE", views: 2377 },
  { url: "https://www.instagram.com/reel/DOKpBvDCcbC", platform: "INSTAGRAM", views: 6327 },
  { url: "https://www.instagram.com/reel/DOJRp3niP-A", platform: "INSTAGRAM", views: 5984 },
  { url: "https://www.instagram.com/reel/DOIuGaMiMCr", platform: "INSTAGRAM", views: 15243 },
  { url: "https://www.instagram.com/reel/DOK-sVLkr3e", platform: "INSTAGRAM", views: 14269 },
  { url: "https://www.instagram.com/reel/DOG6sgUjWYO", platform: "INSTAGRAM", views: 17905 },
  { url: "https://www.instagram.com/reel/DOKMr5gkvcX", platform: "INSTAGRAM", views: 24593 },
  { url: "https://www.instagram.com/reel/DOKEiQQkkgB", platform: "INSTAGRAM", views: 23582 },
  { url: "https://www.instagram.com/reel/DOJ_lqaEvO8", platform: "INSTAGRAM", views: 24586 },
  { url: "https://www.instagram.com/reel/DOImBAbiPfz", platform: "INSTAGRAM", views: 29587 },
  { url: "https://www.instagram.com/reel/DOJvzE7CFDT", platform: "INSTAGRAM", views: 37658 },
  { url: "https://www.instagram.com/reel/DOKRWK5EiMu", platform: "INSTAGRAM", views: 40972 },
  { url: "https://www.instagram.com/reel/DOG3M7ZiLop", platform: "INSTAGRAM", views: 53900 },
  { url: "https://www.instagram.com/reel/DOLEsaqiOju", platform: "INSTAGRAM", views: 60398 },
  { url: "https://www.instagram.com/reel/DOKCXCEkqdn", platform: "INSTAGRAM", views: 64917 },
  { url: "https://www.instagram.com/reel/DOKTGhmku3e", platform: "INSTAGRAM", views: 62915 },
  { url: "https://www.instagram.com/reel/DOJwT_xjZil", platform: "INSTAGRAM", views: 196335 },
  { url: "https://www.instagram.com/reel/DOJEHjUCH-7", platform: "INSTAGRAM", views: 302658 },
  { url: "https://www.instagram.com/reel/DOGxW3NiA2K", platform: "INSTAGRAM", views: 297612 },
  { url: "https://www.instagram.com/reel/DOLK3AXiMER", platform: "INSTAGRAM", views: 302853 },
  { url: "https://www.instagram.com/reel/DOKGK_ciO-9", platform: "INSTAGRAM", views: 1428303 },
  { url: "https://www.instagram.com/reel/DOHMa2FiHwr", platform: "INSTAGRAM", views: 1673605 }
]

async function createOwningManhattanCampaign() {
  try {
    console.log('🏢 Creating Owning Manhattan campaign...')

    // Find or create the user x2sides@gmail.com
    let user = await prisma.user.findFirst({
      where: { email: 'x2sides@gmail.com' }
    })

    if (!user) {
      console.log('👤 Creating user x2sides@gmail.com...')
      user = await prisma.user.create({
        data: {
          email: 'x2sides@gmail.com',
          name: 'Test Clipper',
          role: 'CLIPPER',
          supabaseAuthId: 'test-auth-id-' + Date.now(),
        }
      })
    }

    console.log('✅ User found/created:', user.email)

    // Create the campaign
    const campaign = await prisma.campaign.create({
      data: {
        title: 'Owning Manhattan - Netflix Series Promotion',
        description: 'Create viral clips from Netflix\'s hit real estate series "Owning Manhattan". Focus on luxury properties, agent drama, and behind-the-scenes moments. Target real estate and lifestyle audiences.',
        creator: 'Netflix Marketing Team',
        budget: 1000.00,
        spent: 1000.00,
        payoutRate: 25.00,
        deadline: new Date('2024-12-31T23:59:59Z'),
        startDate: new Date('2024-10-01T00:00:00Z'),
        status: 'COMPLETED',
        targetPlatforms: ['INSTAGRAM', 'YOUTUBE', 'TIKTOK'],
        requirements: [
          'Must include "Owning Manhattan" branding',
          'Focus on luxury real estate content',
          'Minimum 30 seconds duration',
          'High-quality video production',
          'Include relevant hashtags'
        ],
        featuredImage: 'https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/owningmanhattan.avif'
      }
    })

    console.log('✅ Campaign created:', campaign.title)

    // Create submissions
    console.log('📝 Creating sample submissions...')
    
    for (let i = 0; i < sampleSubmissions.length; i++) {
      const submission = sampleSubmissions[i]
      await prisma.clipSubmission.create({
        data: {
          campaignId: campaign.id,
          userId: user.id,
          clipUrl: submission.url,
          platform: submission.platform,
          status: i < 40 ? 'APPROVED' : 'PENDING', // Approve first 40 for $1,000 budget
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
        }
      })
    }

    console.log('✅ Created', sampleSubmissions.length, 'sample submissions')

    // Update campaign spent based on approved submissions
    // Since budget is $1,000 and payout is $25, approve 40 submissions for exactly $1,000
    const approvedCount = Math.min(sampleSubmissions.length, 40)
    const totalSpent = approvedCount * 25.00 // $25 per approved submission
    
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { spent: totalSpent }
    })

    console.log('💰 Updated campaign spent to $', totalSpent)

    console.log('\n🎉 Owning Manhattan campaign setup complete!')
    console.log('📊 Campaign Summary:')
    console.log('   - Title:', campaign.title)
    console.log('   - Budget: $', campaign.budget.toString())
    console.log('   - Spent: $', totalSpent)
    console.log('   - Submissions:', approvedCount)
    console.log('   - Status:', campaign.status)
    console.log('   - Platforms:', campaign.targetPlatforms.join(', '))

  } catch (error) {
    console.error('❌ Error creating campaign:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createOwningManhattanCampaign()
