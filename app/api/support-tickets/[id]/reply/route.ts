// Force this route to be dynamic
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const replySchema = z.object({
  reply: z.string().min(5, "Reply must be at least 5 characters").max(1000),
})

// POST - Submit a reply to a ticket (for clippers)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const ticketId = params.id
    const body = await request.json()
    const { reply } = replySchema.parse(body)

    // Get the ticket
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId }
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Verify ownership
    if (ticket.userId !== dbUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Check if ticket is still open for replies
    if (ticket.status === 'CLOSED' || ticket.status === 'RESOLVED') {
      return NextResponse.json({ error: "Cannot reply to closed or resolved tickets" }, { status: 400 })
    }

    // Check if admin has responded
    if (!ticket.adminResponse) {
      return NextResponse.json({ error: "Cannot reply until support has responded" }, { status: 400 })
    }

    // Check if already replied
    if (ticket.userReply) {
      return NextResponse.json({ error: "You have already replied to this ticket" }, { status: 400 })
    }

    // Update the ticket with user reply
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        userReply: reply,
        userReplyAt: new Date(),
        status: 'OPEN' // Reopen if it was IN_PROGRESS
      }
    })

    // Notify admins about the reply
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    })

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          type: 'SYSTEM_UPDATE',
          title: 'New Ticket Reply',
          message: `User replied to ticket: ${ticket.subject}`,
          data: { ticketId: ticket.id }
        }))
      })
    }

    return NextResponse.json(updatedTicket)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }
    console.error("Error submitting reply:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

