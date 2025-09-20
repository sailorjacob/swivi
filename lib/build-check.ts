// Build-time health checks
console.log("🔍 Running build health checks...")

// Check Node.js version
const nodeVersion = process.version
console.log(`📦 Node.js version: ${nodeVersion}`)

// Check environment
const isDev = process.env.NODE_ENV === "development"
const isProd = process.env.NODE_ENV === "production"
const isVercel = process.env.VERCEL === "1"

console.log(`🌍 Environment: ${process.env.NODE_ENV}`)
console.log(`🚀 Vercel build: ${isVercel ? "YES" : "NO"}`)

// Check critical environment variables
const criticalEnvVars = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL"
]

const missingVars = criticalEnvVars.filter(varName => !process.env[varName])

if (missingVars.length > 0) {
  console.warn("⚠️ Missing environment variables:", missingVars)
  if (isProd) {
    console.error("❌ Critical variables missing in production!")
  }
} else {
  console.log("✅ All critical environment variables present")
}

// Check database connection format
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL
  if (dbUrl.includes("postgresql://")) {
    console.log("✅ PostgreSQL database URL format correct")
  } else {
    console.warn("⚠️ DATABASE_URL doesn't appear to be PostgreSQL format")
  }
} else {
  console.warn("⚠️ DATABASE_URL not provided")
}

console.log("✅ Build health check completed")

export const buildCheck = {
  nodeVersion,
  isDev,
  isProd,
  isVercel,
  missingVars,
  timestamp: new Date().toISOString()
}
