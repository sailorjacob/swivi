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
  Wallet
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SwiviLogo } from "@/components/ui/icons/swivi-logo"
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
    label: "Payout Management",
    href: "/admin/payouts",
    icon: Wallet
  },
  {
    label: "View Analytics",
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
        
        {/* Back to Clipper Dashboard */}
        <div className="pt-4 mt-4 border-t border-border">
          <Link
            href="/clippers/dashboard"
            className="flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group relative text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <div className="relative flex-shrink-0 transition-transform duration-200 ease-out scale-100 group-hover:scale-110">
              <ArrowLeft className="w-5 h-5 transition-all duration-200 opacity-100" />
            </div>
            <span className="font-medium text-sm tracking-wide">Back to Clipper Dashboard</span>
          </Link>
        </div>
      </nav>

      {/* Branding Image */}
      <div className="px-4 pb-2">
        <div className="flex justify-center">
          <Image
            src="https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/345.png"
            alt="Swivi Branding"
            width={80}
            height={80}
            className="rounded opacity-90"
            unoptimized
          />
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={activeSession?.user?.image || ""} />
            <AvatarFallback className="bg-foreground text-primary-foreground">
              {activeSession?.user?.name?.[0] || "A"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-foreground text-sm font-medium truncate">
              {activeSession?.user?.name || "Admin"}
            </p>
            <p className="text-muted-foreground text-xs truncate">
              {activeSession?.user?.email || ""}
            </p>
          </div>
        </div>

        <Button
          onClick={handleSignOut}
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
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
    router.push("/clippers/dashboard")
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
      </div>
    </div>
  )
}
