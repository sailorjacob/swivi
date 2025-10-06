#!/usr/bin/env node

/**
 * Vercel Database Connection Fix Guide
 */

console.log('🚨 VERCEL DATABASE CONNECTION FIX')
console.log('================================')
console.log('')
console.log('❌ Issue: Vercel cannot connect to Supabase database')
console.log('✅ Solution: Use Supabase connection pooler URL')
console.log('')

console.log('📋 STEP-BY-STEP FIX:')
console.log('')

console.log('1️⃣  ENABLE SUPABASE CONNECTION POOLING:')
console.log('   • Go to: https://app.supabase.com')
console.log('   • Select your project')
console.log('   • Navigate to: Settings → Database → Connection pooling')
console.log('   • Click: "Enable" connection pooling')
console.log('   • Wait for it to activate (may take a few minutes)')
console.log('')

console.log('2️⃣  GET THE POOLER URL:')
console.log('   • In the same Connection pooling section')
console.log('   • Copy the "Pooled connection string"')
console.log('   • It should look like:')
console.log('     postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres')
console.log('   • Note: It ends with .pooler.supabase.com:6543')
console.log('')

console.log('3️⃣  UPDATE VERCEL ENVIRONMENT VARIABLES:')
console.log('   • Go to: https://vercel.com/dashboard')
console.log('   • Select your project')
console.log('   • Go to: Settings → Environment Variables')
console.log('   • Find: DATABASE_URL')
console.log('   • Replace the value with your pooled URL')
console.log('   • Click: "Save"')
console.log('')

console.log('4️⃣  REDEPLOY TO VERCEL:')
console.log('   • Go to: Vercel Dashboard → Your Project')
console.log('   • Click: "Redeploy" or push a new commit')
console.log('   • Wait for deployment to complete')
console.log('')

console.log('5️⃣  TEST PRODUCTION:')
console.log('   • Visit: https://swivimedia.com/clippers/login')
console.log('   • Try Discord login')
console.log('   • Check Vercel logs for any remaining errors')
console.log('')

console.log('🎯 COMMON MISTAKES TO AVOID:')
console.log('   ❌ Using direct database URL (db.[project].supabase.co:5432)')
console.log('   ❌ Not waiting for connection pooling to activate')
console.log('   ❌ Using wrong pooled URL format')
console.log('   ❌ Not redeploying after updating environment variables')
console.log('')

console.log('🔍 VERIFICATION:')
console.log('   • Pooled URL should end with: .pooler.supabase.com:6543')
console.log('   • Direct URL ends with: db.[project].supabase.co:5432')
console.log('   • You can tell them apart by the port number (6543 vs 5432)')
console.log('')

console.log('✅ AFTER FIXING:')
console.log('   • No more "Can\'t reach database server" errors')
console.log('   • Discord login works in production')
console.log('   • No more 500 errors on profile/aggregate endpoints')
