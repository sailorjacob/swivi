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
  BarChart3,
  Eye,
  Menu,
  LogOut,
  ExternalLink
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
  className 
}: { 
  token: string
  partnerName: string
  className?: string 
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
        <Link href={`/partner/${token}`} className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
          <SwiviLogo size={36} />
          <div>
            <h1 className="text-foreground font-light text-lg">Partner Portal</h1>
            <p className="text-muted-foreground text-xs truncate max-w-[140px]">
              {partnerName}
            </p>
          </div>
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
        >
          <SwiviLogo size={20} />
          <span>Back to Home</span>
        </Link>
      </div>
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
          <p className="text-muted-foreground">Loading Partner Portal...</p>
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
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 h-full">
        <PartnerNav token={token} partnerName={partnerData.partnerName} />
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetContent side="left" className="p-0 w-64 bg-card border-r border-border">
          <PartnerNav token={token} partnerName={partnerData.partnerName} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <Link href={`/partner/${token}`} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <SwiviLogo size={32} />
            <h1 className="text-foreground font-light">Partner Portal</h1>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-card border-r border-border">
              <PartnerNav token={token} partnerName={partnerData.partnerName} />
            </SheetContent>
          </Sheet>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-full"
          >
            {children}
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card flex-shrink-0">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Swivi Partner Portal
            </div>
            <ThemeToggle size="sm" />
          </div>
        </footer>
      </div>
    </div>
  )
}
