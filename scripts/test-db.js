// Quick database connection test
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully!')
    
    // Try to count users (table might not exist yet)
    try {
      const count = await prisma.user.count()
      console.log(`Found ${count} users in database`)
    } catch (e) {
      console.log('⚠️  User table does not exist yet (this is normal for first setup)')
    }
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ Database connection failed!')
    console.error('Error:', error.message)
    console.error('\nMake sure your DATABASE_URL in .env is correct')
    console.error('Get it from Supabase Dashboard → Settings → Database → Connection string')
  }
}

testConnection()
