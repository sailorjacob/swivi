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

    // Check if user has verified accounts
    const checkAccounts = async () => {
      try {
        const response = await authenticatedFetch("/api/user/connected-accounts")
        if (response.ok) {
          const accounts = await response.json()
          // Filter to only social accounts (not OAuth login accounts)
          const socialAccounts = accounts.filter((acc: any) => acc.type === 'social' && !acc.isOAuth)
          // Show prompt only if no verified social accounts
          if (socialAccounts.length === 0) {
            setShow(true)
          }
        }
      } catch (error) {
        // Don't show on error
        console.log("Could not check accounts:", error)
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
    <div className={`relative bg-muted/50 border border-border rounded-lg p-4 mb-6 ${className}`}>
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-4 pr-8">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <UserCircle className="w-5 h-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground mb-1">
            Complete your profile to start earning
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Verify at least one social account to submit clips to campaigns.
          </p>
          
          <Link href="/clippers/dashboard/profile">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs rounded-full px-4 border-foreground/30 hover:bg-foreground hover:text-background transition-all"
            >
              Verify Account
              <ArrowRight className="w-3 h-3 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

