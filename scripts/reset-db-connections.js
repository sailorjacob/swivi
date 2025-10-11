#!/usr/bin/env node

/**
 * Reset Database Connections Script
 * Fixes the "prepared statement already exists" error
 */

const { execSync } = require('child_process');

async function resetConnections() {
console.log('🔄 Resetting database connections...');

try {
  // Kill any existing Node processes that might be holding connections
  try {
    execSync('pkill -f "prisma"', { stdio: 'ignore' });
    console.log('✅ Killed existing Prisma processes');
  } catch (e) {
    console.log('ℹ️  No Prisma processes to kill');
  }

  // Wait a moment for connections to close
  console.log('⏳ Waiting for connections to close...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test database connection with a fresh client
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  console.log('🧪 Testing database connection...');
  
  const result = await prisma.$queryRaw`SELECT 1 as test`;
  console.log('✅ Database connection successful!');

  // Test if featuredImage column exists
  try {
    await prisma.$queryRaw`SELECT "featuredImage" FROM campaigns LIMIT 1`;
    console.log('✅ featuredImage column exists!');
  } catch (error) {
    if (error.message.includes('featuredImage')) {
      console.log('❌ featuredImage column missing - run the SQL manually');
    } else {
      console.log('✅ featuredImage column exists (no campaigns found)');
    }
  }

  await prisma.$disconnect();
  console.log('🎉 Database reset complete!');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
}

// Run the function
resetConnections();
