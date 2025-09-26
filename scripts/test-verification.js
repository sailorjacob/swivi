#!/usr/bin/env node

/**
 * Social Media Verification Test Utility
 * 
 * This script helps test the social media verification flow
 * by simulating requests to your verification endpoints.
 */

const { spawn } = require('child_process');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000', // Change to your dev server URL
  platforms: ['instagram', 'youtube', 'tiktok', 'twitter'],
  testUsername: 'testuser123'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'     // Reset
  };
  
  const color = colors[type] || colors.info;
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

function displayInstructions() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 SOCIAL MEDIA VERIFICATION TROUBLESHOOTING GUIDE');
  console.log('='.repeat(60));
  
  console.log('\n📋 COMMON ISSUES & SOLUTIONS:\n');
  
  console.log('1. "Code not found in bio"');
  console.log('   → Check if profile is public (not private)');
  console.log('   → Verify code was added exactly as generated');
  console.log('   → Wait 30 seconds after saving profile changes');
  console.log('   → Try regenerating the code\n');
  
  console.log('2. "No pending verification found"');
  console.log('   → Generate a new verification code first');
  console.log('   → Check if code expired (24-hour limit)');
  console.log('   → Ensure username matches exactly\n');
  
  console.log('3. Instagram rate limiting (429 errors)');
  console.log('   → Wait 5-10 minutes between attempts');
  console.log('   → Use different usernames for testing');
  console.log('   → Consider using test profiles\n');
  
  console.log('4. Profile not found errors');
  console.log('   → Double-check username spelling');
  console.log('   → Remove @ symbol from username');
  console.log('   → Ensure account exists and is public\n');
  
  console.log('🔧 TESTING STEPS:\n');
  console.log('1. Start your development server: npm run dev');
  console.log('2. Go to /clippers/profile in your browser');
  console.log('3. Open browser DevTools (F12) → Console tab');
  console.log('4. Try verification flow and check console logs');
  console.log('5. Look for detailed error messages in logs\n');
  
  console.log('📊 DATABASE CHECK QUERIES:\n');
  console.log('-- Check recent verification attempts');
  console.log('SELECT * FROM social_verifications');
  console.log('WHERE created_at > NOW() - INTERVAL 1 DAY');
  console.log('ORDER BY created_at DESC LIMIT 10;\n');
  
  console.log('-- Check verified accounts');
  console.log('SELECT * FROM social_accounts');
  console.log('WHERE verified = true');
  console.log('ORDER BY verified_at DESC LIMIT 10;\n');
  
  console.log('🌐 MANUAL TESTING URLs:\n');
  TEST_CONFIG.platforms.forEach(platform => {
    console.log(`${platform.toUpperCase()}: Check bio manually at:`);
    if (platform === 'instagram') {
      console.log(`   https://www.instagram.com/${TEST_CONFIG.testUsername}/`);
    } else if (platform === 'youtube') {
      console.log(`   https://www.youtube.com/@${TEST_CONFIG.testUsername}`);
    } else if (platform === 'twitter') {
      console.log(`   https://twitter.com/${TEST_CONFIG.testUsername}`);
    } else if (platform === 'tiktok') {
      console.log(`   https://www.tiktok.com/@${TEST_CONFIG.testUsername}`);
    }
  });
  
  console.log('\n🚀 PRODUCTION DEPLOYMENT CHECKLIST:\n');
  console.log('□ Set up proper rate limiting');
  console.log('□ Configure production database');
  console.log('□ Test with real social media profiles');
  console.log('□ Monitor verification success rates');
  console.log('□ Set up error tracking (Sentry, etc.)');
  console.log('□ Create user documentation');
  
  console.log('\n' + '='.repeat(60));
}

function checkDependencies() {
  log('Checking if development server is running...', 'info');
  
  // Simple check if Next.js dev server is running
  fetch(`${TEST_CONFIG.baseUrl}/api/health`)
    .then(response => {
      if (response.ok) {
        log('✅ Development server is running', 'success');
      } else {
        log('❌ Development server responded with error', 'error');
      }
    })
    .catch(() => {
      log('❌ Development server not accessible. Run: npm run dev', 'error');
    });
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    displayInstructions();
    return;
  }
  
  if (args.includes('--check')) {
    checkDependencies();
    return;
  }
  
  // Default: show instructions
  displayInstructions();
  
  console.log('\n💡 TIP: Run with --check to test server connectivity');
  console.log('💡 TIP: Check browser console for detailed verification logs\n');
}

// Handle global fetch if not available (older Node versions)
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

main();
