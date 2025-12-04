// Force this route to be dynamic
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createTicketSchema = z.object({
  category: z.enum(["VERIFICATION", "PAYOUTS", "CAMPAIGN", "BONUS", "OTHER"]),
  subject: z.string().min(5, "Subject must be at least 5 characters").max(200),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
  imageUrl: z.string().url().optional().nullable(),
})

// GET - List user's tickets (for clippers) or all tickets (for admins)
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the internal user ID and role
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true, role: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isAdmin = dbUser.role === 'ADMIN'
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Build where clause
    const where: any = {}
    
    // Non-admins can only see their own tickets
    if (!isAdmin) {
      where.userId = dbUser.id
    }
    
    // Filter by status if provided
    if (status && ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
      where.status = status
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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

    return NextResponse.json(tickets)

  } catch (error) {
    console.error("Error fetching support tickets:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new support ticket
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the internal user ID
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = createTicketSchema.parse(body)

    // Create the ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: dbUser.id,
        category: validatedData.category,
        subject: validatedData.subject,
        message: validatedData.message,
        imageUrl: validatedData.imageUrl || null,
        status: 'OPEN'
      }
    })

    // Notify admins (create notifications)
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    })

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          type: 'SYSTEM_UPDATE',
          title: 'New Support Ticket',
          message: `New ${validatedData.category.toLowerCase()} ticket: ${validatedData.subject}`,
          data: { ticketId: ticket.id, category: validatedData.category }
        }))
      })
    }

    return NextResponse.json(ticket, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }
    console.error("Error creating support ticket:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

