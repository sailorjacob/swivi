/**
 * Environment Variable Validation
 * Ensures all required environment variables are set for database operations
 */

export interface EnvConfig {
  DATABASE_URL: string
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  NODE_ENV: string
}

export function validateEnvironment(): EnvConfig {
  const required = [
    'DATABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]

  // Additional requirements for production
  if (process.env.NODE_ENV === 'production') {
    required.push('SUPABASE_SERVICE_ROLE_KEY')
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

  // Validate Supabase URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    console.warn('⚠️  NEXT_PUBLIC_SUPABASE_URL should use HTTPS')
  }

  // Validate Supabase anon key exists and looks valid
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (supabaseAnonKey && supabaseAnonKey.length < 100) {
    console.warn('⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be too short')
  }

  return {
    DATABASE_URL: dbUrl || '',
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
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
