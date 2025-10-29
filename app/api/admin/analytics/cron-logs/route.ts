import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerUserWithRole } from '@/lib/supabase-auth-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await getServerUserWithRole(request)
    
    if (!authResult || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { user } = authResult
    
    // Check if user is actually an admin
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { role: true }
    })
    
    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const jobName = searchParams.get('jobName')

    // Build where clause
    const where: any = {}
    if (jobName) {
      where.jobName = jobName
    }

    // Fetch recent cron job logs
    const logs = await prisma.cronJobLog.findMany({
      where,
      orderBy: {
        startedAt: 'desc'
      },
      take: limit
    })

    return NextResponse.json({
      success: true,
      logs: logs.map(log => ({
        ...log,
        earningsCalculated: Number(log.earningsCalculated || 0)
      })),
      total: logs.length
    })

  } catch (error) {
    console.error('Error fetching cron logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cron logs' },
      { status: 500 }
    )
  }
}

