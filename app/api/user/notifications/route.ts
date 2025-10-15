import { NextRequest, NextResponse } from "next/server"
import { getServerUser } from "@/lib/supabase-auth-server"
import { NotificationService } from "@/lib/notification-service"
import { RateLimitingService } from "@/lib/rate-limiting-service"

export async function GET(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitingService = RateLimitingService.getInstance()
    const rateLimitResult = await rateLimitingService.checkRateLimit(
      'notifications:read',
      request.ip || 'unknown'
    )

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      )
    }

    const { user, error } = await getServerUser(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const notificationService = new NotificationService()

    const result = await notificationService.getUserNotifications(user.id, {
      limit,
      offset,
      unreadOnly
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitingService = RateLimitingService.getInstance()
    const rateLimitResult = await rateLimitingService.checkRateLimit(
      'notifications:update',
      request.ip || 'unknown'
    )

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      )
    }

    const { user, error } = await getServerUser(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, notificationId } = body

    const notificationService = new NotificationService()

    if (action === 'markAllRead') {
      await notificationService.markAllAsRead(user.id)
      return NextResponse.json({ message: "All notifications marked as read" })
    }

    if (action === 'markRead' && notificationId) {
      await notificationService.markAsRead(notificationId, user.id)
      return NextResponse.json({ message: "Notification marked as read" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
