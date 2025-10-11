#!/bin/bash

# Safe Migration Script for Swivi
# Prevents prepared statement conflicts

echo "🔄 Starting safe migration process..."

# Step 1: Stop all development processes
echo "📴 Stopping development servers..."
pkill -f "next dev" 2>/dev/null || echo "No Next.js server running"
pkill -f "prisma studio" 2>/dev/null || echo "No Prisma Studio running"

# Step 2: Wait for connections to close
echo "⏳ Waiting for connections to close..."
sleep 3

# Step 3: Generate fresh Prisma client
echo "🔧 Generating fresh Prisma client..."
npx prisma generate

# Step 4: Try to push schema changes
echo "📤 Pushing schema changes..."
if npx prisma db push --accept-data-loss; then
    echo "✅ Schema push successful!"
else
    echo "⚠️  Schema push failed - you may need to run SQL manually"
    echo "📋 Manual SQL commands needed:"
    echo "   ALTER TABLE campaigns ADD COLUMN \"featuredImage\" TEXT;"
fi

# Step 5: Restart development server
echo "🚀 Restarting development server..."
npm run dev &

echo "🎉 Migration process complete!"
echo "💡 If issues persist, restart your terminal and try again"
