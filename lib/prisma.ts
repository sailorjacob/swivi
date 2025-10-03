import { PrismaClient } from '@prisma/client'
import { validateEnvironment } from './env-check'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Database URL configuration for Supabase
const getDatabaseUrl = () => {
  const env = validateEnvironment()

  // For Supabase, use the raw DATABASE_URL without modifications
  // Any connection parameters in the URL might be causing pool issues
  console.log('🔍 DATABASE_URL length:', env.DATABASE_URL.length)
  console.log('🔍 DATABASE_URL has query params:', env.DATABASE_URL.includes('?'))

  // Return the raw URL without modification to avoid connection pool issues
  return env.DATABASE_URL
}

// Enhanced Prisma configuration for production-ready development
const createPrismaClient = () => {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
      datasources: {
        db: {
          url: getDatabaseUrl(),
        },
      },
      errorFormat: 'minimal',
      // Production-optimized settings with better connection handling
      transactionOptions: {
        maxWait: process.env.NODE_ENV === 'production' ? 30000 : 45000, // 30 seconds in production
        timeout: process.env.NODE_ENV === 'production' ? 25000 : 30000, // 25 seconds in production
      }
    })
  } catch (error) {
    console.warn('Failed to create Prisma client during build, using fallback configuration:', error)
    // Return a Prisma client with fallback configuration for build time
    return new PrismaClient({
      log: ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/db'
        }
      },
      errorFormat: 'minimal'
    })
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

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
