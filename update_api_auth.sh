#!/bin/bash

# List of API files that need NextAuth.js -> Supabase Auth updates
files=(
  "app/api/admin/analytics/aggregate/route.ts"
  "app/api/admin/campaigns/[id]/route.ts"
  "app/api/admin/campaigns/analytics/route.ts"
  "app/api/admin/submissions/[id]/route.ts"
  "app/api/admin/submissions/route.ts"
  "app/api/admin/users/[id]/role/route.ts"
  "app/api/campaigns/route.ts"
  "app/api/clippers/clips/route.ts"
  "app/api/clippers/dashboard/route.ts"
  "app/api/clippers/payouts/route.ts"
  "app/api/user/role/route.ts"
  "app/api/user/profile/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"
    
    # Replace NextAuth.js imports with Supabase Auth imports
    sed -i 's/import { getServerSession } from "next-auth"/import { requireAdmin, getAuthenticatedUser } from "@/lib\/supabase-auth-server"/g' "$file"
    sed -i 's/import { authOptions } from "@/lib\/auth"//g' "$file"
    
    # Replace getServerSession calls with requireAdmin or getAuthenticatedUser
    sed -i 's/getServerSession(authOptions)/requireAdmin(request)/g' "$file"
    
    echo "✓ Updated: $file"
  else
    echo "❌ File not found: $file"
  fi
done

echo "API auth migration complete!"
