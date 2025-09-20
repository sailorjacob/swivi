"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Home,
  User,
  Target,
  BarChart3,
  DollarSign,
  Users,
  Trophy,
  FileText,
  HelpCircle,
  BookOpen,
  Play,
  ExternalLink,
  Eye,
  ArrowRight,
  CheckCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { motion } from "framer-motion"

interface DemoPage {
  title: string
  description: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  status: 'complete' | 'partial' | 'planned'
  features: string[]
}

const demoPages: DemoPage[] = [
  {
    title: "Clipper Landing Page",
    description: "Marketing page showcasing the clipper program with stats, testimonials, and sign-up flow",
    path: "/clippers",
    icon: Home,
    status: 'complete',
    features: ["Hero section", "Stats showcase", "How it works", "Benefits", "FAQ preview", "CTAs"]
  },
  {
    title: "Interactive Onboarding",
    description: "Multi-step tutorial teaching new clippers about requirements, platforms, and processes",
    path: "/clippers/onboarding",
    icon: BookOpen,
    status: 'complete',
    features: ["Step-by-step guide", "Interactive elements", "Progress tracking", "Completion rewards"]
  },
  {
    title: "Dashboard Overview",
    description: "Main dashboard showing stats, recent activities, and quick actions for clippers",
    path: "/clippers/dashboard",
    icon: BarChart3,
    status: 'complete',
    features: ["Performance metrics", "Recent submissions", "Quick actions", "Earnings overview"]
  },
  {
    title: "Active Campaigns",
    description: "Browse and join available campaigns with detailed requirements and payout information",
    path: "/clippers/dashboard/campaigns",
    icon: Target,
    status: 'complete',
    features: ["Campaign listing", "Filter options", "Join campaigns", "Requirements display"]
  },
  {
    title: "Analytics Dashboard",
    description: "Detailed performance analytics with charts, trends, and insights",
    path: "/clippers/dashboard/analytics",
    icon: BarChart3,
    status: 'partial',
    features: ["Performance charts", "Trend analysis", "Comparison metrics", "Export options"]
  },
  {
    title: "Profile Management",
    description: "Manage personal information, preferences, and account settings",
    path: "/clippers/dashboard/profile",
    icon: User,
    status: 'partial',
    features: ["Personal info", "Preferences", "Account settings", "Profile completion"]
  },
  {
    title: "Payout Management",
    description: "Track earnings, request payouts, and manage payment methods",
    path: "/clippers/dashboard/payouts",
    icon: DollarSign,
    status: 'partial',
    features: ["Payment history", "Payout requests", "PayPal integration", "Earnings breakdown"]
  },
  {
    title: "Referral System",
    description: "Track referrals, view earnings from referred clippers, and manage referral links",
    path: "/clippers/dashboard/referrals",
    icon: Trophy,
    status: 'partial', 
    features: ["Referral tracking", "Bonus earnings", "Invite links", "Performance metrics"]
  },
  {
    title: "Social Account Manager",
    description: "Connect and verify social media accounts across platforms",
    path: "/clippers/dashboard/social-accounts",
    icon: Users,
    status: 'partial',
    features: ["Multi-platform support", "Account verification", "Connection status", "Platform analytics"]
  },
  {
    title: "Rules & Guidelines",
    description: "Detailed rules, requirements, and best practices for clippers",
    path: "/clippers/dashboard/rules",
    icon: FileText,
    status: 'partial',
    features: ["Comprehensive rules", "Best practices", "Violation policies", "Success tips"]
  },
  {
    title: "Support Center",
    description: "Help desk, ticket system, and direct support for clippers",
    path: "/clippers/dashboard/support",
    icon: HelpCircle,
    status: 'partial',
    features: ["Ticket system", "Live chat", "Knowledge base", "Response tracking"]
  }
]

function StatusBadge({ status }: { status: DemoPage['status'] }) {
  const config = {
    complete: { label: "Complete", className: "bg-green-500/20 text-green-400 border-green-500/50" },
    partial: { label: "In Progress", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" },
    planned: { label: "Planned", className: "bg-gray-500/20 text-gray-400 border-gray-500/50" }
  }
  
  const { label, className } = config[status]
  
  return (
    <Badge variant="outline" className={className}>
      {status === 'complete' && <CheckCircle className="w-3 h-3 mr-1" />}
      {label}
    </Badge>
  )
}

function DemoPageCard({ page, index }: { page: DemoPage; index: number }) {
  const Icon = page.icon
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="h-full hover:shadow-lg transition-all duration-300 bg-card border-border hover:border-muted-foreground/30">
        <CardHeader>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-muted rounded-lg">
                <Icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg font-medium">{page.title}</CardTitle>
              </div>
            </div>
            <StatusBadge status={page.status} />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {page.description}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Key Features</h4>
              <ul className="space-y-1">
                {page.features.map((feature, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-center">
                    <span className="w-1 h-1 bg-muted-foreground rounded-full mr-2 flex-shrink-0"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-4 group"
              asChild
            >
              <a href={page.path} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function ClippersDemoPage() {
  const completePages = demoPages.filter(p => p.status === 'complete')
  const inProgressPages = demoPages.filter(p => p.status === 'partial')
  const plannedPages = demoPages.filter(p => p.status === 'planned')

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex min-h-screen flex-col pt-16">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-background">
          <div className="max-width-wrapper section-padding">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-light mb-6">
                  Platform <span className="italic">Demo</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                  Explore the complete Swivi Clippers experience. Click through live pages 
                  to see how clippers discover campaigns, track earnings, and grow their income.
                </p>
                <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>{completePages.length} Complete</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>{inProgressPages.length} In Progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span>{plannedPages.length} Planned</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Complete Pages */}
            <div className="mb-16">
              <h2 className="text-2xl font-light mb-8">✅ Complete Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completePages.map((page, index) => (
                  <DemoPageCard key={page.path} page={page} index={index} />
                ))}
              </div>
            </div>

            {/* In Progress Pages */}
            {inProgressPages.length > 0 && (
              <div className="mb-16">
                <h2 className="text-2xl font-light mb-8">🚧 In Development</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {inProgressPages.map((page, index) => (
                    <DemoPageCard key={page.path} page={page} index={index} />
                  ))}
                </div>
              </div>
            )}

            {/* Platform Overview */}
            <div className="mt-16">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-xl font-medium">Platform Overview</CardTitle>
                  <p className="text-muted-foreground">
                    The Swivi Clippers platform enables content creators to monetize their editing skills 
                    by creating viral clips for established creators and brands.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-medium mb-3">Core Features</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Campaign-based clip creation</li>
                        <li>• Performance tracking & analytics</li>
                        <li>• Automated payout system</li>
                        <li>• Multi-platform social integration</li>
                        <li>• Referral program</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Tech Stack</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Next.js 14 & React</li>
                        <li>• TypeScript & Tailwind CSS</li>
                        <li>• Framer Motion animations</li>
                        <li>• Chart.js for analytics</li>
                        <li>• NextAuth.js (ready for integration)</li>
                        <li>• Responsive design system</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}