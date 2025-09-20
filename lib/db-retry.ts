import { prisma } from "./prisma"

export async function connectWithRetry(maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect()
      console.log("✅ Database connected successfully")
      return true
    } catch (error) {
      console.warn(`❌ Database connection attempt ${attempt} failed:`, error)
      
      if (attempt === maxRetries) {
        console.error("💥 All database connection attempts failed")
        // Don't throw during build - just log and continue
        if (process.env.NODE_ENV !== "production") {
          console.log("🔧 In development mode - continuing without database")
          return false
        }
        throw error
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
  return false
}

// Only try to connect if DATABASE_URL is provided
export async function conditionalConnect() {
  if (!process.env.DATABASE_URL) {
    console.log("⚠️ DATABASE_URL not provided - skipping database connection")
    return false
  }
  
  return await connectWithRetry()
}
