"use client"

import { useSession } from "next-auth/react"
import { useState } from "react"
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
  const { data: session, status, update } = useSession()
  const [isVisible, setIsVisible] = useState(false)
  
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
                <span className="text-muted-foreground">User:</span>
                <div className="text-white ml-2">
                  {session.user?.name || "No name"}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <div className="text-white ml-2">
                  {session.user?.email || "No email"}
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
              onClick={() => update()}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              Refresh
            </Button>
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
