import { PrismaClient } from '@prisma/client'
import { validateEnvironment } from './env-check'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Database URL configuration for Supabase
const getDatabaseUrl = () => {
  const env = validateEnvironment()
  
  // Add pgBouncer parameters for Supabase pooling compatibility
  const url = new URL(env.DATABASE_URL)
  url.searchParams.set('pgbouncer', 'true')
  url.searchParams.set('connection_limit', '1')
  
  return url.toString()
}

// Enhanced Prisma configuration for production-ready development
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['error', 'warn'] 
    : ['error'],
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
  errorFormat: 'minimal'
})

// Only cache in development to prevent memory leaks
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Enhanced graceful shutdown handling
if (typeof window === "undefined") {
  const disconnectPrisma = async () => {
    try {
      await prisma.$disconnect()
      console.log('Prisma disconnected gracefully')
    } catch (error) {
      console.error('Error disconnecting Prisma:', error)
    }
  }

  process.on('beforeExit', disconnectPrisma)
  process.on('SIGINT', async () => {
    await disconnectPrisma()
    process.exit(0)
  })
  process.on('SIGTERM', async () => {
    await disconnectPrisma()
    process.exit(0)
  })
  
  // Handle uncaught exceptions to prevent connection leaks
  process.on('uncaughtException', async (error) => {
    console.error('Uncaught exception:', error)
    await disconnectPrisma()
    process.exit(1)
  })
}
