/**
 * Environment Variable Validation
 * Ensures all required environment variables are set for database operations
 */

export interface EnvConfig {
  DATABASE_URL: string
  NEXTAUTH_SECRET: string
  DISCORD_CLIENT_ID?: string
  DISCORD_CLIENT_SECRET?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  NODE_ENV: string
}

export function validateEnvironment(): EnvConfig {
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET'
  ]

  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  // Validate DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL!
  if (!dbUrl.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string')
  }

  // Check if it's a Supabase pooler URL (which we need for our setup)
  if (!dbUrl.includes('pooler.supabase.com')) {
    console.warn('⚠️  DATABASE_URL does not appear to be a Supabase pooler URL. This may cause connection issues.')
  }

  return {
    DATABASE_URL: dbUrl,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NODE_ENV: process.env.NODE_ENV || 'development'
  }
}

// Validate on module load
try {
  validateEnvironment()
  console.log('✅ Environment variables validated successfully')
} catch (error: any) {
  console.error('❌ Environment validation failed:', error.message)
  if (process.env.NODE_ENV === 'production') {
    process.exit(1)
  }
}
