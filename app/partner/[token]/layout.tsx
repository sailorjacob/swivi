"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useParams, useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Target,
  FileText,
  Menu,
  Home
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SwiviLogo } from "@/components/ui/icons/swivi-logo"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { cn } from "@/lib/utils"

interface PartnerData {
  partnerName: string
  campaignCount: number
}

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

function PartnerNav({ 
  token, 
  partnerName,
  className,
  onNavigate
}: { 
  token: string
  partnerName: string
  className?: string
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    { label: "Dashboard", href: `/partner/${token}`, icon: LayoutDashboard },
    { label: "Campaigns", href: `/partner/${token}/campaigns`, icon: Target },
    { label: "Reports", href: `/partner/${token}/reports`, icon: FileText },
  ]

  const isActive = (href: string) => {
    if (href === `/partner/${token}`) {
      return pathname === `/partner/${token}`
    }
    return pathname.startsWith(href)
  }

  return (
    <div className={cn("flex flex-col h-full bg-card border-r border-border", className)}>
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link 
          href={`/partner/${token}`} 
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          onClick={onNavigate}
        >
          <SwiviLogo size={36} />
          <h1 className="text-foreground font-light text-lg">Partner</h1>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group relative",
                active
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className={cn(
                "relative flex-shrink-0 transition-transform duration-200 ease-out",
                active ? "scale-110" : "scale-100 group-hover:scale-110"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm tracking-wide">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Home Link */}
      <div className="p-4 border-t border-border">
        <Link
          href="/"
          className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          onClick={onNavigate}
        >
          <SwiviLogo size={20} />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  )
}

// Mobile Bottom Navigation
function MobileBottomNav({ token }: { token: string }) {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    { label: "Dashboard", href: `/partner/${token}`, icon: LayoutDashboard },
    { label: "Campaigns", href: `/partner/${token}/campaigns`, icon: Target },
    { label: "Reports", href: `/partner/${token}/reports`, icon: FileText },
  ]

  const isActive = (href: string) => {
    if (href === `/partner/${token}`) {
      return pathname === `/partner/${token}`
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <nav className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-all min-w-[72px]",
                active
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-colors mb-1",
                active ? "bg-foreground/10" : ""
              )}>
                <Icon className={cn("w-5 h-5", active && "text-foreground")} />
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                active ? "text-foreground" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
        <Link
          href="/"
          className="flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-all text-muted-foreground min-w-[72px]"
        >
          <div className="p-1.5 rounded-lg mb-1">
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium">Home</span>
        </Link>
      </nav>
    </div>
  )
}

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const token = params.token as string
  const router = useRouter()
  
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/partner/${token}/validate`)
        if (response.ok) {
          const data = await response.json()
          setPartnerData(data)
        } else if (response.status === 404) {
          setError("Invalid access token")
        } else {
          setError("Unable to validate access")
        }
      } catch (err) {
        setError("Connection error")
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      validateToken()
    }
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !partnerData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <SwiviLogo size={48} className="mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Error</h2>
          <p className="text-muted-foreground mb-6">{error || "Unable to access Partner Portal"}</p>
          <p className="text-sm text-muted-foreground">
            Please check your access link or contact your Swivi representative.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 h-screen sticky top-0">
        <PartnerNav token={token} partnerName={partnerData.partnerName} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-40">
          <Link href={`/partner/${token}`} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <SwiviLogo size={28} />
            <h1 className="text-foreground font-light text-sm">Partner</h1>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle size="sm" />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-card border-r border-border">
                <PartnerNav 
                  token={token} 
                  partnerName={partnerData.partnerName} 
                  onNavigate={() => setMobileMenuOpen(false)}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 pb-20 lg:pb-0">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>

        {/* Desktop Footer */}
        <footer className="hidden lg:block border-t border-border bg-card">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Swivi Partners
            </div>
            <ThemeToggle size="sm" />
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav token={token} />
    </div>
  )
}
