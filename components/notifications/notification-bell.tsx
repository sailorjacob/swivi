"use client"

import { useState, useEffect } from "react"
import { Bell, Check, X, DollarSign, Target, Rocket, Link2, AlertCircle, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { authenticatedFetch } from "@/lib/supabase-browser"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
  data?: any
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await authenticatedFetch("/api/user/notifications?limit=20")
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unread)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await authenticatedFetch("/api/user/notifications", {
        method: "PUT",
        body: JSON.stringify({
          action: "markRead",
          notificationId
        })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await authenticatedFetch("/api/user/notifications", {
        method: "PUT",
        body: JSON.stringify({
          action: "markAllRead"
        })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  // Get notification icon based on type - minimal icons
  const NotificationIcon = ({ type }: { type: string }) => {
    const iconClass = "h-3.5 w-3.5 text-muted-foreground"
    
    switch (type) {
      case 'SUBMISSION_APPROVED':
        return <Check className={iconClass} />
      case 'SUBMISSION_REJECTED':
        return <X className={iconClass} />
      case 'PAYOUT_PROCESSED':
      case 'PAYOUT_READY':
        return <DollarSign className={iconClass} />
      case 'CAMPAIGN_COMPLETED':
        return <Target className={iconClass} />
      case 'NEW_CAMPAIGN_AVAILABLE':
        return <Rocket className={iconClass} />
      case 'VERIFICATION_SUCCESS':
        return <Link2 className={iconClass} />
      case 'VERIFICATION_FAILED':
        return <AlertCircle className={iconClass} />
      default:
        return <MessageSquare className={iconClass} />
    }
  }

  // Load notifications when component mounts or popover opens
  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open])

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Initial load
  useEffect(() => {
    fetchNotifications()
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-foreground text-background text-[10px] font-medium rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 shadow-lg" align="end">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="max-h-80">
          {loading ? (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-muted-foreground">Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                    index !== notifications.length - 1 ? 'border-b border-border/50' : ''
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex gap-3 items-start">
                    {/* Icon */}
                    <div className="mt-0.5 flex-shrink-0">
                      <NotificationIcon type={notification.type} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs leading-snug ${
                          !notification.read ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {notification.message}
                        </p>
                        {!notification.read && (
                          <span className="w-1.5 h-1.5 bg-foreground rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
