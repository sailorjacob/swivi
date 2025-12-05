/**
 * Run Bounty Applications Migration
 * 
 * Usage:
 *   node scripts/run-bounty-migration.js
 * 
 * Make sure DATABASE_URL is set in your .env.local file
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.log('\nMake sure you have DATABASE_URL set in your .env.local file');
  console.log('\nAlternatively, you can run the migration directly in Supabase SQL Editor:');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the contents of:');
  console.log('   prisma/migrations/20241205_bounty_applications/migration.sql');
  console.log('4. Click "Run"');
  process.exit(1);
}

console.log('🚀 Running Bounty Applications Migration...\n');

const migrationPath = path.join(__dirname, '../prisma/migrations/20241205_bounty_applications/migration.sql');
const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

console.log('📄 Migration SQL:');
console.log('─'.repeat(50));
console.log(migrationSql);
console.log('─'.repeat(50));

// Also run the campaign soft delete migration if it exists
const softDeletePath = path.join(__dirname, '../prisma/migrations/20241205_campaign_soft_delete/migration.sql');
if (fs.existsSync(softDeletePath)) {
  console.log('\n📄 Also found Campaign Soft Delete Migration');
}

console.log('\n⚠️  This script will run the migration against your database.');
console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

setTimeout(async () => {
  try {
    // Use psql to run the migration
    const command = `psql "${databaseUrl}" -f "${migrationPath}"`;
    
    console.log('🔄 Executing migration...\n');
    execSync(command, { stdio: 'inherit' });
    
    console.log('\n✅ Migration completed successfully!');
    
    // Also run soft delete migration if exists
    if (fs.existsSync(softDeletePath)) {
      console.log('\n🔄 Running Campaign Soft Delete Migration...');
      execSync(`psql "${databaseUrl}" -f "${softDeletePath}"`, { stdio: 'inherit' });
      console.log('✅ Campaign Soft Delete Migration completed!');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\nTry running the migration manually:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the SQL from the migration file');
    console.log('4. Click "Run"');
    process.exit(1);
  }
}, 5000);

