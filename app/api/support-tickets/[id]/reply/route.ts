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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params for Next.js 15 compatibility
    const { id: ticketId } = await params
    
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      console.log("❌ Reply auth failed:", error?.message)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the internal user ID - try by supabaseAuthId first, then by email
    let dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true, email: true }
    })

    // If not found by supabaseAuthId, try by email (handles OAuth provider changes)
    if (!dbUser && user.email) {
      console.log("⚠️ User not found by supabaseAuthId, trying email lookup...")
      dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true, email: true }
      })
      
      // If found by email, update their supabaseAuthId
      if (dbUser) {
        console.log("✅ Found user by email, updating supabaseAuthId...")
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { supabaseAuthId: user.id }
        })
      }
    }

    if (!dbUser) {
      console.log("❌ User not found in DB for supabaseAuthId:", user.id, "or email:", user.email)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("📧 Reply attempt by:", dbUser.email, "dbUser.id:", dbUser.id)

    const body = await request.json()
    const { reply } = replySchema.parse(body)

    // Get the ticket with user info
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        users: {
          select: { email: true }
        }
      }
    })

    if (!ticket) {
      console.log("❌ Ticket not found:", ticketId)
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    console.log("🎫 Ticket owner:", ticket.users?.email, "ticket.userId:", ticket.userId)

    // Verify ownership - compare internal DB user IDs
    if (ticket.userId !== dbUser.id) {
      console.log("❌ Ownership mismatch!")
      console.log("   - Ticket userId:", ticket.userId)
      console.log("   - Ticket owner email:", ticket.users?.email)
      console.log("   - Current user dbId:", dbUser.id)
      console.log("   - Current user email:", dbUser.email)
      return NextResponse.json({ 
        error: "You can only reply to your own tickets" 
      }, { status: 403 })
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

    console.log("✅ Ownership verified, updating ticket...")

    // Update the ticket with user reply
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        userReply: reply,
        userReplyAt: new Date(),
        status: 'OPEN' // Reopen if it was IN_PROGRESS
      }
    })

    console.log("✅ Reply saved successfully")

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

