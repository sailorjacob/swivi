"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart3,
  User,
  DollarSign,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Trophy,
  FileText,
  MessageSquare,
  Home,
  Target,
  TrendingUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SwiviLogo } from "@/components/ui/icons/swivi-logo"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { FloatingBranding } from "@/components/ui/floating-branding"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }> | string
  badge?: string
}

  const navItems: NavItem[] = [
    { label: "Campaigns", href: "/clippers/dashboard/campaigns", icon: "https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/345.png" },
    { label: "Dashboard", href: "/clippers/dashboard", icon: "https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/3422.png" },
    { label: "Profile", href: "/clippers/dashboard/profile", icon: "https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/342.png" },
    // Analytics temporarily hidden for platform cleanup
    // { label: "Analytics", href: "/clippers/dashboard/analytics", icon: BarChart3 },
    { label: "Payouts", href: "/clippers/dashboard/payouts", icon: "https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/233.png" },
  ]

  const renderNavIcon = (icon: React.ComponentType<{ className?: string }> | string, className?: string) => {
    if (typeof icon === 'string') {
      return (
        <Image
          src={icon}
          alt="nav icon"
          width={32}
          height={32}
          className={cn("rounded", className)}
          unoptimized
        />
      )
    }
    const IconComponent = icon
    return <IconComponent className={className} />
  }

function Sidebar({ className }: { className?: string }) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  // Demo mode mock session
  const isDemoMode = process.env.NODE_ENV === "development"
  const mockSession = isDemoMode ? {
    user: {
      name: "Demo Clipper",
      email: "demo@swivi.com",
      image: null
    }
  } : null

  const activeSession = session || mockSession

  const handleSignOut = async () => {
    if (isDemoMode) {
      // In demo mode, just redirect to clipper landing page
      router.push("/clippers")
      return
    }
    await signOut({ callbackUrl: "/clippers/login" })
  }

  const isActive = (href: string) => {
    if (href === "/clippers/dashboard") {
      return pathname === "/clippers/dashboard"
    }
    return pathname.startsWith(href)
  }

  return (
    <div className={cn("flex flex-col h-full bg-card border-r border-border", className)}>
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
          <SwiviLogo size={36} />
          <div>
            <h1 className="text-foreground font-light text-lg">Swivi Clippers</h1>
            {isDemoMode && (
              <p className="text-muted-foreground text-xs">
                Demo Mode - Explore Features
              </p>
            )}
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
              <div className="relative w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200 ease-out">
                {renderNavIcon(item.icon, cn(
                  "transition-all duration-200 w-8 h-8 -ml-1.5 -mt-1.5",
                  active ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                ))}
              </div>
              <span className="font-medium text-sm tracking-wide">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={activeSession?.user?.image || ""} />
            <AvatarFallback className="bg-foreground text-primary-foreground">
              {activeSession?.user?.name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-foreground text-sm font-medium truncate">
              {activeSession?.user?.name || "Clipper"}
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 h-full">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-card border-r border-border">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <SwiviLogo size={32} />
            <h1 className="text-foreground font-light">Swivi Clippers</h1>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-card border-r border-border">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="p-6 min-h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>

          {/* Removed overlapping branding element */}
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card flex-shrink-0">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Swivi. All rights reserved.
            </div>
            <Link href="/clippers/dashboard/support">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <HelpCircle className="w-4 h-4 mr-2" />
                Support
              </Button>
            </Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
