"use client"

import { useState, useEffect } from "react"
import { authenticatedFetch } from "@/lib/supabase-browser"
import { X, UserCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface AccountSetupPromptProps {
  className?: string
}

export function AccountSetupPrompt({ className = "" }: AccountSetupPromptProps) {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if already dismissed in this session
    const wasDismissed = sessionStorage.getItem('account-setup-dismissed')
    if (wasDismissed) {
      setLoading(false)
      return
    }

    // Check if user has verified social accounts (not OAuth login)
    const checkAccounts = async () => {
      try {
        const response = await authenticatedFetch("/api/user/connected-accounts")
        if (response.ok) {
          const accounts = await response.json()
          
          // Only count actual verified social media accounts (TikTok, YouTube, Instagram)
          // NOT the OAuth provider used to log in (Discord, Google, etc.)
          const verifiedSocialAccounts = Array.isArray(accounts) 
            ? accounts.filter((acc: any) => {
                // Must be a social account type, not OAuth
                const isSocialType = acc.type === 'social'
                // Must not be the OAuth login provider
                const notOAuth = !acc.isOAuth
                // Platform should be one of the content platforms
                const isContentPlatform = ['TIKTOK', 'YOUTUBE', 'INSTAGRAM', 'TWITTER'].includes(acc.platform?.toUpperCase())
                
                return isSocialType && notOAuth && isContentPlatform
              })
            : []
          
          // Show prompt if no verified content platform accounts
          if (verifiedSocialAccounts.length === 0) {
            setShow(true)
          }
        } else {
          // API error - show prompt as a safe default for new users
          console.log("Connected accounts API returned non-OK:", response.status)
          setShow(true)
        }
      } catch (error) {
        // On error, show prompt as safe default
        console.log("Could not check accounts:", error)
        setShow(true)
      } finally {
        setLoading(false)
      }
    }

    checkAccounts()
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    setShow(false)
    sessionStorage.setItem('account-setup-dismissed', 'true')
  }

  if (loading || !show || dismissed) {
    return null
  }

  return (
    <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)] bg-card border border-border rounded-full shadow-lg px-4 py-2.5 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <UserCircle className="w-4 h-4 text-primary" />
        </div>
        
        <p className="text-xs text-muted-foreground flex-1">
          Verify a social account to submit clips
        </p>
        
        <Link href="/creators/dashboard/profile">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs rounded-full px-3 border-foreground/30 hover:bg-foreground hover:text-background transition-all"
          >
            Verify
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
        
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

