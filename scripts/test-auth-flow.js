#!/usr/bin/env node

/**
 * Authentication Flow Test Script
 * 
 * This script validates the authentication flow end-to-end.
 * Run this locally to check if auth is working properly.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Authentication Flow...\n');

// Check if environment variables are set
function checkEnvVars() {
  console.log('📋 Checking environment variables...');
  
  const required = [
    'NEXTAUTH_SECRET',
    'DISCORD_CLIENT_ID', 
    'DISCORD_CLIENT_SECRET',
    'DATABASE_URL'
  ];
  
  const missing = [];
  
  required.forEach(envVar => {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  });
  
  if (missing.length > 0) {
    console.log('❌ Missing environment variables:');
    missing.forEach(envVar => console.log(`   - ${envVar}`));
    console.log('\n💡 Make sure your .env file contains all required variables.');
    return false;
  }
  
  console.log('✅ All required environment variables are set\n');
  return true;
}

// Check if Discord OAuth is properly configured
function checkDiscordConfig() {
  console.log('🎮 Checking Discord OAuth configuration...');
  
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.log('❌ Discord OAuth not configured');
    return false;
  }
  
  if (clientId.length < 10 || clientSecret.length < 10) {
    console.log('❌ Discord credentials appear to be invalid (too short)');
    return false;
  }
  
  console.log('✅ Discord OAuth configuration looks good\n');
  return true;
}

// Check NextAuth configuration
function checkNextAuthConfig() {
  console.log('🔐 Checking NextAuth configuration...');
  
  const nextAuthUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  
  if (!nextAuthSecret || nextAuthSecret === 'your-secret-key-here') {
    console.log('❌ NEXTAUTH_SECRET not properly configured');
    return false;
  }
  
  console.log(`✅ NextAuth URL: ${nextAuthUrl}`);
  console.log('✅ NextAuth secret is configured\n');
  return true;
}

// Check if auth files exist and are properly configured
function checkAuthFiles() {
  console.log('📄 Checking authentication files...');
  
  const authFiles = [
    'lib/auth.ts',
    'app/api/auth/[...nextauth]/route.ts',
    'middleware.ts',
    'components/providers/auth-provider.tsx'
  ];
  
  const missing = [];
  
  authFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      missing.push(file);
    }
  });
  
  if (missing.length > 0) {
    console.log('❌ Missing authentication files:');
    missing.forEach(file => console.log(`   - ${file}`));
    return false;
  }
  
  console.log('✅ All authentication files are present\n');
  return true;
}

// Run all checks
async function runTests() {
  const checks = [
    checkEnvVars,
    checkDiscordConfig, 
    checkNextAuthConfig,
    checkAuthFiles
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    if (!check()) {
      allPassed = false;
    }
  }
  
  console.log('=' .repeat(50));
  
  if (allPassed) {
    console.log('🎉 All authentication checks passed!');
    console.log('\n📋 Manual test checklist:');
    console.log('1. Start the dev server: npm run dev');
    console.log('2. Visit http://localhost:3000');
    console.log('3. Click "Dashboard" or "Sign In"');
    console.log('4. Test Discord authentication');
    console.log('5. Verify redirect to dashboard works');
    console.log('6. Test logout functionality');
    console.log('\n🔧 If you see redirect issues:');
    console.log('- Check Discord app redirect URI: http://localhost:3000/api/auth/callback/discord');
    console.log('- Verify NEXTAUTH_URL matches your local URL');
  } else {
    console.log('❌ Some authentication checks failed. Please fix the issues above.');
    console.log('\n💡 For help, check the setup documentation or logs.');
  }
}

// Load environment variables from .env
if (fs.existsSync('.env.local')) {
  console.log('📦 Loading .env.local...');
  require('dotenv').config({ path: '.env.local' });
} else if (fs.existsSync('.env')) {
  console.log('📦 Loading .env...');
  require('dotenv').config();
} else {
  console.log('⚠️  No .env file found, using system environment variables only');
}

runTests();
