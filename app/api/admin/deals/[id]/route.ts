import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/supabase-auth-server'

// GET /api/admin/deals/[id] - Get single deal
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (process.env.NODE_ENV !== 'development') {
      if (!session || session.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const deal = await prisma.deal.findUnique({
      where: { id: params.id }
    })

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    return NextResponse.json({ deal })
  } catch (error) {
    console.error('Error fetching deal:', error)
    return NextResponse.json({ error: 'Failed to fetch deal' }, { status: 500 })
  }
}

// PUT /api/admin/deals/[id] - Update a deal
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (process.env.NODE_ENV !== 'development') {
      if (!session || session.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await req.json()
    
    // Recalculate totals if lineItems changed
    let updateData: any = { ...body }
    
    if (body.lineItems) {
      const subtotal = body.lineItems.reduce((sum: number, item: any) => sum + (item.quantity * item.rate), 0)
      const discountAmount = (body.discountType || 'percentage') === 'percentage' 
        ? subtotal * ((body.discount || 0) / 100) 
        : body.discount || 0
      const taxAmount = (subtotal - discountAmount) * ((body.taxRate || 0) / 100)
      const total = subtotal - discountAmount + taxAmount
      
      updateData.subtotal = subtotal
      updateData.total = total
    }
    
    // Convert dates
    if (updateData.dealDate) {
      updateData.dealDate = new Date(updateData.dealDate)
    }
    if (updateData.validUntil) {
      updateData.validUntil = new Date(updateData.validUntil)
    }
    
    // Convert type and status to uppercase
    if (updateData.type) {
      updateData.type = updateData.type.toUpperCase()
    }
    if (updateData.status) {
      updateData.status = updateData.status.toUpperCase()
    }

    const deal = await prisma.deal.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json({ deal })
  } catch (error) {
    console.error('Error updating deal:', error)
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 })
  }
}

// DELETE /api/admin/deals/[id] - Delete a deal
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (process.env.NODE_ENV !== 'development') {
      if (!session || session.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    await prisma.deal.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting deal:', error)
    return NextResponse.json({ error: 'Failed to delete deal' }, { status: 500 })
  }
}

