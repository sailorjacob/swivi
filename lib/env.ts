// Environment variable validation and defaults
export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || "",
  
  // Authentication
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://localhost:3000",
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev",
  
  // OAuth Providers (optional during build)
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || "",
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET || "",
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || "",
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || "",
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  
  // Cloudinary (optional)
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  
  // Email (optional)
  EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST || "",
  EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT || "",
  EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER || "",
  EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "",
  
  // Analytics (optional)
  NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "",
  NEXT_PUBLIC_VERCEL_ANALYTICS_ID: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID || "",
  
  // API Keys (optional)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  NEWS_API_KEY: process.env.NEWS_API_KEY || "",
  SOCIAL_MEDIA_API_KEY: process.env.SOCIAL_MEDIA_API_KEY || "",
}

// Runtime validation function
export function validateEnv() {
  const required = {
    DATABASE_URL: env.DATABASE_URL,
    NEXTAUTH_SECRET: env.NEXTAUTH_SECRET,
  }
  
  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key)
  
  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(", ")}`)
    // Don't throw during build, just warn
    if (process.env.NODE_ENV === "production") {
      console.error("❌ Critical environment variables missing in production!")
    }
  }
  
  return missing.length === 0
}

// Build-time check (non-blocking)
if (typeof window === "undefined") {
  validateEnv()
}
