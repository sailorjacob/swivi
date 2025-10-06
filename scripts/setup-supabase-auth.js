#!/usr/bin/env node

/**
 * Supabase Auth Setup Script
 * This script helps configure Supabase Auth providers
 */

const https = require('https')

async function setupSupabaseAuth() {
  console.log('🚀 Setting up Supabase Auth...\n')

  console.log('📋 **REQUIRED ACTIONS:**')
  console.log('\n📘 Discord Setup:')
  console.log('1. Go to: https://discord.com/developers/applications')
  console.log('2. Select your app (or create new one)')
  console.log('3. OAuth2 → General → Redirects → Add:')
  console.log('   https://your-project-ref.supabase.co/auth/v1/callback')
  console.log('4. Copy Client ID and Secret')
  console.log('5. Go to Supabase Dashboard → Authentication → Providers')
  console.log('6. Enable Discord provider')
  console.log('7. Paste Client ID and Secret')

  console.log('\n📗 Google Setup:')
  console.log('1. Go to: https://console.cloud.google.com/')
  console.log('2. Select project (or create new one)')
  console.log('3. APIs & Services → Credentials')
  console.log('4. Create OAuth 2.0 Client ID (Web application)')
  console.log('5. Authorized redirect URIs → Add:')
  console.log('   https://your-project-ref.supabase.co/auth/v1/callback')
  console.log('6. Copy Client ID and Secret')
  console.log('7. Go to Supabase Dashboard → Authentication → Providers')
  console.log('8. Enable Google provider')
  console.log('9. Paste Client ID and Secret')

  console.log('\n⚙️ Supabase Auth Configuration:')
  console.log('1. Go to Supabase Dashboard → Authentication → Settings')
  console.log('2. Site URL: https://www.swivimedia.com')
  console.log('3. Redirect URLs:')
  console.log('   - https://www.swivimedia.com/clippers/dashboard')
  console.log('   - http://localhost:3000/clippers/dashboard')
  console.log('4. Enable "Enable email confirmations" (recommended)')

  console.log('\n🧪 **Test Process:**')
  console.log('1. Complete Discord & Google setup above')
  console.log('2. Wait 5-10 minutes for changes to propagate')
  console.log('3. Update your .env.local file:')
  console.log('   ```bash')
  console.log('   # Keep these Supabase vars')
  console.log('   NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"')
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"')
  console.log('   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"')
  console.log('   ')
  console.log('   # Remove these NextAuth.js vars')
  console.log('   # NEXTAUTH_SECRET')
  console.log('   # DISCORD_CLIENT_ID/SECRET')
  console.log('   # GOOGLE_CLIENT_ID/SECRET')
  console.log('   ```')
  console.log('4. Try signup/login again')

  console.log('\n📊 **Monitor Success:**')
  console.log('• Supabase Auth logs: Check your Supabase dashboard')
  console.log('• Browser console: Look for auth state changes')
  console.log('• Success: User redirected to dashboard, not login page')
}

setupSupabaseAuth().catch(console.error)
