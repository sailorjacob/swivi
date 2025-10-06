"use client"

import { useSession } from "@/lib/supabase-auth-provider"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

/**
 * Session Debug Component
 * 
 * Only shows in development mode to help debug authentication issues.
 * Shows current session state, status, and allows manual refresh.
 */
export function SessionDebug() {
  const { data: session, status } = useSession()
  const [isVisible, setIsVisible] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (session?.user) {
        try {
          const response = await fetch("/api/user/profile")
          if (response.ok) {
            const profileData = await response.json()
            setUserProfile(profileData)
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error)
        }
      }
    }

    fetchUserProfile()
  }, [session])

  // Supabase Auth handles session refresh automatically
  // No need for manual refresh intervals

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null
  }
  
  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur-sm"
        >
          🔍 Debug Auth
        </Button>
      </div>
    )
  }
  
  return (
    <div className="fixed bottom-4 left-4 z-50 w-80">
      <Card className="bg-background/95 backdrop-blur-sm border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Auth Debug</CardTitle>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            <Badge variant={
              status === "authenticated" ? "default" :
              status === "loading" ? "secondary" : "destructive"
            }>
              {status}
            </Badge>
          </div>
          
          {session && (
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-muted-foreground">Session Name:</span>
                <div className="text-white ml-2">
                  {session.user?.name || session.user?.email?.split('@')[0] || "No name"}
                </div>
                <div className="text-xs text-muted-foreground ml-2">
                  (From Supabase Auth)
                </div>
              </div>
              {userProfile && (
                <div>
                  <span className="text-muted-foreground">Database Name:</span>
                  <div className="text-white ml-2">
                    {userProfile.name || "No name in database"}
                  </div>
                  <div className="text-xs text-muted-foreground ml-2">
                    (From user profile)
                  </div>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Email:</span>
                <div className="text-white ml-2">
                  {session.user?.email || "No email"}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">User ID:</span>
                <div className="text-white ml-2 text-xs break-all">
                  {session.user?.id || "No ID"}
                </div>
              </div>
              {session.user?.role && (
                <div>
                  <span className="text-muted-foreground">Role:</span>
                  <div className="text-white ml-2">{session.user.role}</div>
                </div>
              )}
            </div>
          )}
          
          {!session && status === "unauthenticated" && (
            <div className="text-xs text-muted-foreground">
              No active session
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              onClick={() => console.log("Session:", session, "Status:", status)}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              Log to Console
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
