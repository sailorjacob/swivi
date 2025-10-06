#!/bin/bash

# List of pages that need dynamic exports
pages=(
  "app/case-studies/owning-manhattan/page.tsx"
  "app/community/page.tsx"
  "app/music-hub/page.tsx"
  "app/page.tsx"
  "app/privacy-policy/page.tsx"
  "app/terms-of-service/page.tsx"
  "app/clippers/landing/page.tsx"
  "app/clippers/campaigns/page.tsx"
  "app/clippers/dashboard/faq/page.tsx"
  "app/clippers/dashboard/referrals/page.tsx"
  "app/clippers/dashboard/rules/page.tsx"
  "app/clippers/dashboard/social-accounts/page.tsx"
  "app/clippers/dashboard/support/page.tsx"
)

for file in "${pages[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"
    
    # Check if dynamic export already exists
    if grep -q "export const dynamic" "$file"; then
      echo "✓ Already has dynamic export: $file"
      continue
    fi
    
    # Read first line to check if it starts with "use client" or is an import
    first_line=$(head -1 "$file")
    
    if [[ "$first_line" == '"use client"' ]]; then
      # Add dynamic export after use client
      sed -i.bak '2a\
// Force this page to be dynamic (not statically generated)\
export const dynamic = '\''force-dynamic'\''\
' "$file"
    else
      # Add dynamic export at the beginning
      sed -i.bak '1a\
// Force this page to be dynamic (not statically generated)\
export const dynamic = '\''force-dynamic'\''\
' "$file"
    fi
    
    echo "✓ Added dynamic export to: $file"
  else
    echo "❌ File not found: $file"
  fi
done

echo "Dynamic export fix complete!"
