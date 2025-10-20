// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking user linking status...')
    
    // Reset connection to avoid prepared statement conflicts
    await prisma.$disconnect()
    await prisma.$connect()
    
    // Get all users from database
    const dbUsers = await prisma.user.findMany({
      select: {
        id: true,
        supabaseAuthId: true,
        email: true,
        name: true,
        role: true,
        verified: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20 // Limit to recent 20 users
    })

    // Analyze linking status
    const linkedUsers = dbUsers.filter(user => user.supabaseAuthId)
    const unlinkedUsers = dbUsers.filter(user => !user.supabaseAuthId)
    
    // Check for duplicate emails
    const emailCounts = {}
    dbUsers.forEach(user => {
      emailCounts[user.email] = (emailCounts[user.email] || 0) + 1
    })
    const duplicateEmails = Object.entries(emailCounts).filter(([email, count]) => count > 1)

    const summary = {
      totalUsers: dbUsers.length,
      linkedUsers: linkedUsers.length,
      unlinkedUsers: unlinkedUsers.length,
      duplicateEmails: duplicateEmails.length,
      allUsersLinked: linkedUsers.length === dbUsers.length && duplicateEmails.length === 0
    }

    console.log('📊 User linking summary:', summary)

    return NextResponse.json({
      success: true,
      summary,
      users: {
        linked: linkedUsers.map(user => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          verified: user.verified,
          supabaseAuthId: user.supabaseAuthId,
          createdAt: user.createdAt
        })),
        unlinked: unlinkedUsers.map(user => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          verified: user.verified,
          createdAt: user.createdAt
        }))
      },
      issues: {
        duplicateEmails: duplicateEmails.map(([email, count]) => ({ email, count }))
      },
      recommendations: summary.allUsersLinked ? 
        ['✅ All users are properly linked!'] : 
        [
          unlinkedUsers.length > 0 ? `❌ ${unlinkedUsers.length} users need to log in again to link their accounts` : null,
          duplicateEmails.length > 0 ? `⚠️ ${duplicateEmails.length} duplicate email issues need manual resolution` : null
        ].filter(Boolean)
    })
    
  } catch (error) {
    console.error('❌ Error checking user linking:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      recommendations: [
        'Check DATABASE_URL environment variable',
        'Ensure database is accessible',
        'Check Supabase database status',
        'Try refreshing the page to reset connection'
      ]
    }, { status: 500 })
  } finally {
    // Ensure connection is properly closed
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.warn('Warning: Could not disconnect Prisma client:', disconnectError)
    }
  }
}
