import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/supabase-auth-server'

// GET /api/admin/deals - List all deals
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    // Check admin access (allow in dev mode)
    if (process.env.NODE_ENV !== 'development') {
      if (!session || session.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }
    
    if (search) {
      where.OR = [
        { brandName: { contains: search, mode: 'insensitive' } },
        { campaignName: { contains: search, mode: 'insensitive' } },
        { dealNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    const deals = await prisma.deal.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ deals })
  } catch (error) {
    console.error('Error fetching deals:', error)
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 })
  }
}

// POST /api/admin/deals - Create a new deal
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (process.env.NODE_ENV !== 'development') {
      if (!session || session.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await req.json()
    
    // Generate a unique deal number if not provided
    const dealNumber = body.dealNumber || `SWIVI-${Date.now().toString(36).toUpperCase()}`
    
    // Generate a share token
    const shareToken = `${dealNumber}-${Math.random().toString(36).substring(2, 10)}`

    // Calculate totals
    const lineItems = body.lineItems || []
    const subtotal = lineItems.reduce((sum: number, item: any) => sum + (item.quantity * item.rate), 0)
    const discountAmount = body.discountType === 'percentage' 
      ? subtotal * (body.discount / 100) 
      : body.discount || 0
    const taxAmount = (subtotal - discountAmount) * ((body.taxRate || 0) / 100)
    const total = subtotal - discountAmount + taxAmount

    const deal = await prisma.deal.create({
      data: {
        dealNumber,
        type: body.type?.toUpperCase() || 'PROPOSAL',
        status: body.status?.toUpperCase() || 'DRAFT',
        brandName: body.brandName || null,
        brandContactName: body.brandContactName || null,
        brandEmail: body.brandEmail || null,
        brandPhone: body.brandPhone || null,
        brandAddress: body.brandAddress || null,
        dealDate: body.dealDate ? new Date(body.dealDate) : new Date(),
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        campaignName: body.campaignName || null,
        campaignDescription: body.campaignDescription || null,
        targetPlatforms: body.targetPlatforms || [],
        targetAudience: body.targetAudience || null,
        expectedDeliverables: body.expectedDeliverables || null,
        timeline: body.timeline || null,
        lineItems: lineItems,
        discount: body.discount || 0,
        discountType: body.discountType || 'percentage',
        taxRate: body.taxRate || 0,
        subtotal,
        total,
        paymentTerms: body.paymentTerms || null,
        additionalNotes: body.additionalNotes || null,
        shareToken
      }
    })

    return NextResponse.json({ deal }, { status: 201 })
  } catch (error) {
    console.error('Error creating deal:', error)
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 })
  }
}

