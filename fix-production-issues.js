#!/usr/bin/env node

/**
 * Production Issues Fix Script
 * Fixes Vercel deployment issues with database and OAuth
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '.env');
const ENV_EXAMPLE = path.join(__dirname, 'env.example');

function fixProductionIssues() {
  console.log('🔧 FIXING PRODUCTION ISSUES')
  console.log('===========================')

  // 1. Fix Vercel DATABASE_URL issue
  console.log('\n1️⃣  Fixing Vercel DATABASE_URL (Connection Pooler Required)')
  console.log('   ⚠️  Vercel needs Supabase connection pooler URL for production')
  console.log('   📋 Go to: Supabase Dashboard → Settings → Database → Connection pooling')
  console.log('   🔗 Enable connection pooling and copy the pooled URL')
  console.log('   📝 Replace DATABASE_URL in Vercel with the pooled URL')

  // 2. Fix Discord OAuth URLs
  console.log('\n2️⃣  Discord OAuth Callback URLs')
  console.log('   ✅ Production: https://swivimedia.com/api/auth/callback/discord')
  console.log('   ✅ Local Dev:   http://localhost:3000/api/auth/callback/discord')
  console.log('   📋 Add both to Discord Developer Portal → OAuth2 → Redirects')

  // 3. Check current configuration
  console.log('\n3️⃣  Current Configuration Check')
  if (fs.existsSync(ENV_FILE)) {
    const envContent = fs.readFileSync(ENV_FILE, 'utf8');
    console.log('   ✅ .env file exists')

    if (envContent.includes('DATABASE_URL')) {
      console.log('   ✅ DATABASE_URL configured')
    } else {
      console.log('   ❌ DATABASE_URL missing')
    }

    if (envContent.includes('DISCORD_CLIENT_ID') && envContent.includes('DISCORD_CLIENT_SECRET')) {
      console.log('   ✅ Discord OAuth configured')
    } else {
      console.log('   ❌ Discord OAuth credentials missing')
    }
  } else {
    console.log('   ❌ .env file missing')
  }

  // 4. Production deployment checklist
  console.log('\n4️⃣  Production Deployment Checklist')
  console.log('   ✅ Set NEXTAUTH_URL to: https://swivimedia.com')
  console.log('   ⚠️  Set DATABASE_URL to Supabase connection pooler URL')
  console.log('   ✅ Set Discord OAuth credentials')
  console.log('   ✅ Set Supabase credentials')
  console.log('   📋 Configure Discord OAuth redirect URLs')

  console.log('\n🎯 Summary of Required Actions:')
  console.log('   1. Enable Supabase connection pooling')
  console.log('   2. Update Vercel DATABASE_URL to use pooled URL')
  console.log('   3. Add Discord OAuth redirect URLs to Discord app')
  console.log('   4. Redeploy to Vercel')
}

fixProductionIssues();
