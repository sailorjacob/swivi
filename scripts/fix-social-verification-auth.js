#!/usr/bin/env node

/**
 * Script to fix all social verification API endpoints to use correct auth pattern
 */

const fs = require('fs')
const path = require('path')

const socialVerificationDir = path.join(__dirname, '../app/api/social-verification')

// Get all TypeScript files in the social-verification directory
const files = fs.readdirSync(socialVerificationDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => path.join(socialVerificationDir, dirent.name, 'route.ts'))
  .filter(filePath => fs.existsSync(filePath))

console.log(`🔍 Found ${files.length} social verification API files to fix:`)
files.forEach(file => console.log(`   - ${path.relative(process.cwd(), file)}`))

let totalFixed = 0

files.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false
    
    // Fix 1: Add request parameter to getServerUserWithRole
    if (content.includes('getServerUserWithRole()')) {
      content = content.replace(/getServerUserWithRole\(\)/g, 'getServerUserWithRole(request)')
      modified = true
      console.log(`✅ Fixed getServerUserWithRole() in ${path.basename(path.dirname(filePath))}`)
    }
    
    // Fix 2: Add database user lookup after auth check
    const authCheckPattern = /if \(!user\?\.id \|\| error\) \{[\s\S]*?\}/
    const authCheckMatch = content.match(authCheckPattern)
    
    if (authCheckMatch && !content.includes('const dbUser = await prisma.user.findUnique')) {
      const insertPoint = content.indexOf(authCheckMatch[0]) + authCheckMatch[0].length
      const dbUserLookup = `

    // Get the database user ID
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true }
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      )
    }`
      
      content = content.slice(0, insertPoint) + dbUserLookup + content.slice(insertPoint)
      modified = true
      console.log(`✅ Added database user lookup in ${path.basename(path.dirname(filePath))}`)
    }
    
    // Fix 3: Replace userId: user.id with userId: dbUser.id
    if (content.includes('userId: user.id')) {
      content = content.replace(/userId: user\.id/g, 'userId: dbUser.id')
      modified = true
      console.log(`✅ Fixed userId references in ${path.basename(path.dirname(filePath))}`)
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content)
      totalFixed++
      console.log(`📝 Updated ${path.relative(process.cwd(), filePath)}`)
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message)
  }
})

console.log(`\n🎉 Fixed ${totalFixed} social verification API files!`)
console.log(`\n📋 Next steps:`)
console.log(`   1. Test social verification code generation`)
console.log(`   2. Test social verification submission`)
console.log(`   3. Verify Apify integration still works`)
console.log(`   4. Check that verified accounts display correctly`)
