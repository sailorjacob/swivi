"use client"

// Force this layout to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { useState } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useAuth } from "@/lib/supabase-auth-provider"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Target,
  Shield,
  BarChart3,
  Users,
  LogOut,
  Menu,
  ArrowLeft,
  Wallet,
  Trophy,
  Briefcase
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SwiviLogo } from "@/components/ui/icons/swivi-logo"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { cn } from "@/lib/utils"
import Image from "next/image"
// import { NotificationBell } from "@/components/notifications/notification-bell"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }> | string
}

const navItems: NavItem[] = [
  {
    label: "Manage Campaigns",
    href: "/admin/campaigns",
    icon: Target
  },
  {
    label: "Review Submissions",
    href: "/admin/submissions",
    icon: Shield
  },
  {
    label: "Bounty Applications",
    href: "/admin/bounty-applications",
    icon: Trophy
  },
  {
    label: "Payout Management",
    href: "/admin/payouts",
    icon: Wallet
  },
  {
    label: "Agency",
    href: "/admin/agency",
    icon: Briefcase
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3
  },
  {
    label: "User Management",
    href: "/admin/users",
    icon: Users
  }
]

const renderNavIcon = (icon: React.ComponentType<{ className?: string }> | string, className?: string) => {
  if (typeof icon === 'string') {
    return (
      <Image
        src={icon}
        alt="nav icon"
        width={24}
        height={24}
        className={cn("rounded", className)}
        unoptimized
      />
    )
  }
  const IconComponent = icon
  return <IconComponent className={className} />
}

function AdminNav({ className }: { className?: string }) {
  const { data: session } = useSession()
  const { logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Demo mode mock session for development
  const isDemoMode = process.env.NODE_ENV === "development"
  const mockSession = isDemoMode ? {
    user: {
      name: "Demo Admin",
      email: "admin@swivi.com",
      image: null
    }
  } : null

  const activeSession = session || mockSession

  const handleSignOut = async () => {
    if (isDemoMode) {
      // In demo mode, just redirect to homepage
      router.push("/")
      return
    }
    await logout()
    router.push("/")
  }

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin"
    }
    return pathname.startsWith(href)
  }

  return (
    <div className={cn("flex flex-col h-full bg-card border-r border-border", className)}>
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/admin" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
          <SwiviLogo size={36} />
          <div>
            <h1 className="text-foreground font-light text-lg">Admin Dashboard</h1>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const active = isActive(item.href)
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
                active ? "scale-150" : "scale-100 group-hover:scale-150"
              )}>
                {renderNavIcon(item.icon, cn(
                  "transition-all duration-200 w-5 h-5",
                  "opacity-100"
                ))}
              </div>
              <span className="font-medium text-sm tracking-wide">{item.label}</span>
            </Link>
          )
        })}
        
        {/* Back to Creator Dashboard */}
        <div className="pt-4 mt-4 border-t border-border">
          <Link
            href="/creators/dashboard"
            className="flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group relative text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <div className="relative flex-shrink-0 transition-transform duration-200 ease-out scale-100 group-hover:scale-110">
              <ArrowLeft className="w-5 h-5 transition-all duration-200 opacity-100" />
            </div>
            <span className="font-medium text-sm tracking-wide">Back to Creator Dashboard</span>
          </Link>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={activeSession?.user?.image || ""} />
            <AvatarFallback className="bg-foreground text-primary-foreground">
              {activeSession?.user?.name?.[0] || 
               activeSession?.user?.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-foreground text-sm font-medium truncate">
              {activeSession?.user?.name || 
               activeSession?.user?.email?.split('@')[0] || "User"}
            </p>
            <p className="text-muted-foreground text-xs truncate">
              {activeSession?.user?.email || ""}
            </p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          <LogOut className="w-3 h-3" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()

  // Redirect if not admin
  if (session && session.user?.role !== "ADMIN") {
    router.push("/creators/dashboard")
    return null
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 h-full">
        <AdminNav />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-card border-r border-border">
          <AdminNav />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <Link href="/admin" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <SwiviLogo size={32} />
            <h1 className="text-foreground font-light">Admin Dashboard</h1>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-card border-r border-border">
              <AdminNav />
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
              © {new Date().getFullYear()} Swivi Admin
            </div>
            <ThemeToggle size="sm" />
          </div>
        </footer>
      </div>
    </div>
  )
}
