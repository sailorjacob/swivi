import { PrismaClient } from '@prisma/client'
import { validateEnvironment } from './env-check'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Database URL configuration for Supabase
const getDatabaseUrl = () => {
  const env = validateEnvironment()

  // For Supabase, use connection parameters that work better with prepared statements
  const url = new URL(env.DATABASE_URL)
  url.searchParams.set('pgbouncer', 'true')
  url.searchParams.set('connection_limit', '1')
  url.searchParams.set('connect_timeout', '10')
  url.searchParams.set('application_name', 'swivi-app')

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
  errorFormat: 'minimal',
  // Production-optimized settings
  transactionOptions: {
    maxWait: process.env.NODE_ENV === 'production' ? 10000 : 20000, // 10 seconds in production
    timeout: process.env.NODE_ENV === 'production' ? 8000 : 15000, // 8 seconds in production
  }
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
