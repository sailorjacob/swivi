import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Setting up Swivi database...')

  // Create sample campaigns
  const campaigns = await prisma.campaign.createMany({
    data: [
      {
        title: "Viral TikTok Challenge",
        description: "Create engaging TikTok content featuring our new product launch. Must include trending music and showcase product features.",
        creator: "Nike",
        budget: 50000,
        minPayout: 100,
        maxPayout: 1000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: "ACTIVE",
        requirements: [
          "Minimum 10k views",
          "Must use hashtag #NikeChallenge",
          "Show product clearly",
          "Follow all community guidelines"
        ],
        targetPlatforms: ["TIKTOK", "INSTAGRAM"]
      },
      {
        title: "YouTube Shorts Campaign",
        description: "Short-form content showcasing gaming setup with our gaming chair. Focus on comfort and ergonomics.",
        creator: "HermanMiller Gaming",
        budget: 25000,
        minPayout: 75,
        maxPayout: 500,
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
        status: "ACTIVE",
        requirements: [
          "Gaming content only",
          "Show chair prominently",
          "Minimum 60-second video",
          "Include product link in description"
        ],
        targetPlatforms: ["YOUTUBE"]
      },
      {
        title: "Instagram Reels Food Challenge",
        description: "Showcase our new protein powder in creative cooking/fitness content. Must be authentic and engaging.",
        creator: "OptimumNutrition",
        budget: 15000,
        minPayout: 50,
        maxPayout: 300,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        status: "ACTIVE",
        requirements: [
          "Fitness or cooking theme",
          "Show product preparation",
          "Include nutrition facts",
          "Tag @optimumnutrition"
        ],
        targetPlatforms: ["INSTAGRAM", "TIKTOK"]
      },
      {
        title: "X (Twitter) Tech Review",
        description: "Quick tech reviews and unboxings of our latest smartphone. Focus on key features and daily use cases.",
        creator: "Samsung Mobile",
        budget: 40000,
        minPayout: 200,
        maxPayout: 800,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
        status: "ACTIVE",
        requirements: [
          "Tech review format",
          "Unboxing included",
          "Highlight camera features",
          "Honest opinion required"
        ],
        targetPlatforms: ["TWITTER", "YOUTUBE"]
      }
    ],
    skipDuplicates: true
  })

  console.log(`✅ Created ${campaigns.count} sample campaigns`)

  // You can add more sample data here like users, clips, etc.
  // For development/testing purposes

  console.log('🎉 Database setup complete!')
  console.log('Next steps:')
  console.log('1. Copy .env.example to .env and fill in your values')
  console.log('2. Run `npm run prisma:migrate` to apply the schema')
  console.log('3. Run `npm run dev` to start the development server')
}

main()
  .catch((e) => {
    console.error('❌ Setup failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
