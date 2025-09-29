"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Target,
  Shield,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Menu
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SwiviLogo } from "@/components/ui/icons/swivi-logo"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }> | string
}

const navItems: NavItem[] = [
  {
    label: "Manage Campaigns",
    href: "/admin/campaigns",
    icon: "https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/345.png"
  },
  {
    label: "Review Submissions",
    href: "/admin/submissions",
    icon: Shield
  },
  {
    label: "View Analytics",
    href: "/admin/analytics",
    icon: BarChart3
  },
  {
    label: "User Management",
    href: "/admin/users",
    icon: "https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/342.png"
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
  const router = useRouter()
  const pathname = usePathname()

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
      </nav>
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
