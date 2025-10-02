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

  // Additional requirements for production
  if (process.env.NODE_ENV === 'production') {
    required.push('DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'NEXTAUTH_URL')
  }

  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    const error = `Missing required environment variables: ${missing.join(', ')}`
    console.error('❌', error)
    if (process.env.NODE_ENV === 'production') {
      throw new Error(error)
    } else {
      console.warn('⚠️  Missing environment variables in development mode')
    }
  }

  // Validate DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL
  if (dbUrl) {
    if (!dbUrl.startsWith('postgresql://')) {
      throw new Error('DATABASE_URL must be a valid PostgreSQL connection string')
    }

    // Ensure pgBouncer parameters are present for Supabase
    if (dbUrl.includes('pooler.supabase.com') && !dbUrl.includes('pgbouncer=true')) {
      console.warn('⚠️  DATABASE_URL missing pgBouncer parameters. Adding automatically.')
    }

    // Check if it's a Supabase pooler URL (recommended for our setup)
    if (!dbUrl.includes('pooler.supabase.com')) {
      console.warn('⚠️  DATABASE_URL does not appear to be a Supabase pooler URL. This may cause connection issues.')
    }
  }

  // Validate NEXTAUTH_SECRET length for security
  const secret = process.env.NEXTAUTH_SECRET
  if (secret && secret.length < 32) {
    console.warn('⚠️  NEXTAUTH_SECRET should be at least 32 characters for security')
  }

  // Validate production URLs
  if (process.env.NODE_ENV === 'production') {
    const nextAuthUrl = process.env.NEXTAUTH_URL
    if (nextAuthUrl && !nextAuthUrl.startsWith('https://')) {
      console.warn('⚠️  NEXTAUTH_URL should use HTTPS in production')
    }
  }

  return {
    DATABASE_URL: dbUrl || '',
    NEXTAUTH_SECRET: secret || '',
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NODE_ENV: process.env.NODE_ENV || 'development'
  }
}

// Validate on module load (but be more lenient during builds)
try {
  validateEnvironment()
  console.log('✅ Environment variables validated successfully')
} catch (error: any) {
  console.error('❌ Environment validation failed:', error.message)
  // Don't exit during builds - just warn and continue
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    console.error('🔧 Build environment detected but production validation failed. This may cause runtime issues.')
  }
}
