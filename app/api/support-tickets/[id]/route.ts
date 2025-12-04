// Force this route to be dynamic
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateTicketSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  adminResponse: z.string().min(1).max(2000).optional(),
})

// GET - Get a single ticket
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true, role: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Non-admins can only see their own tickets
    if (dbUser.role !== 'ADMIN' && ticket.userId !== dbUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json(ticket)

  } catch (error) {
    console.error("Error fetching ticket:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Update ticket (admin respond, change status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true, role: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Only admins can update tickets
    if (dbUser.role !== 'ADMIN') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id }
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateTicketSchema.parse(body)

    // Build update data
    const updateData: any = {
      updatedAt: new Date()
    }

    if (validatedData.status) {
      updateData.status = validatedData.status
    }

    if (validatedData.adminResponse) {
      updateData.adminResponse = validatedData.adminResponse
      updateData.respondedBy = dbUser.id
      updateData.respondedAt = new Date()
      
      // Auto-set status to IN_PROGRESS if still OPEN
      if (ticket.status === 'OPEN' && !validatedData.status) {
        updateData.status = 'IN_PROGRESS'
      }
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: params.id },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Notify the user about the response
    if (validatedData.adminResponse) {
      await prisma.notification.create({
        data: {
          userId: ticket.userId,
          type: 'SYSTEM_UPDATE',
          title: 'Support Ticket Update',
          message: `Your ticket "${ticket.subject}" has received a response`,
          data: { ticketId: ticket.id }
        }
      })
    }

    return NextResponse.json(updatedTicket)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }
    console.error("Error updating ticket:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

