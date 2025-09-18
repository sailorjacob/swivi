"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
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
    features: ["5-step tutorial", "Progress tracking", "Interactive content", "Platform overview", "Quick actions"]
  },
  {
    title: "Clipper Dashboard",
    description: "Main hub with earnings overview, recent clips, active campaigns, and quick actions",
    path: "/clippers/dashboard",
    icon: Home,
    status: 'complete',
    features: ["Earnings stats", "Recent clips", "Active campaigns", "Performance metrics", "Quick actions"]
  },
  {
    title: "Campaign Browser",
    description: "Browse and join active campaigns with detailed requirements and payout information",
    path: "/clippers/dashboard/campaigns",
    icon: Target,
    status: 'complete',
    features: ["Campaign grid", "Search & filters", "Detailed views", "Join functionality", "Budget tracking"]
  },
  {
    title: "Clipper Profile",
    description: "Manage profile, submit clips, connect social accounts, and track all submissions",
    path: "/clippers/dashboard/profile",
    icon: User,
    status: 'complete',
    features: ["Profile management", "Clip submission", "Social accounts", "Submission history", "Form validation"]
  },
  {
    title: "Performance Analytics",
    description: "Comprehensive analytics with charts, platform breakdowns, and performance insights",
    path: "/clippers/dashboard/analytics",
    icon: BarChart3,
    status: 'complete',
    features: ["Chart.js integration", "Multi-platform stats", "Time-based analytics", "Top campaigns", "Export options"]
  },
  {
    title: "FAQ & Support",
    description: "Searchable FAQ system with categories covering all aspects of the clipper program",
    path: "/clippers/dashboard/faq",
    icon: HelpCircle,
    status: 'complete',
    features: ["Search functionality", "Category filters", "Expandable answers", "Comprehensive content", "Mobile-friendly"]
  },
  {
    title: "Payouts Management",
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
          <p className="text-muted-foreground text-sm leading-relaxed">
            {page.description}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-foreground">Key Features:</h4>
            <div className="flex flex-wrap gap-1">
              {page.features.map((feature, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex space-x-2 pt-2">
            <Link href={page.path} className="flex-1">
              <Button className="w-full" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                View Page
              </Button>
            </Link>
            <Button variant="outline" size="sm" asChild>
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
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl sm:text-4xl md:text-5xl font-light mb-6"
              >
                Clippers Platform <span className="font-normal">Demo</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8"
              >
                Explore the complete clippers platform experience. Navigate through all the pages and features 
                built for content creators to earn money through viral clip creation.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap justify-center gap-6 text-sm"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{completePages.length} Complete Pages</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Play className="w-4 h-4 text-yellow-500" />
                  <span>{inProgressPages.length} In Development</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-neutral-500" />
                  <span>No Auth Required</span>
                </div>
              </motion.div>
            </div>

            {/* Quick Start */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-16"
            >
              <Card className="bg-gradient-to-r from-muted/50 to-muted border-border">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                    <div>
                      <h3 className="text-xl font-medium mb-2">Quick Start</h3>
                      <p className="text-muted-foreground">
                        Jump straight into the full clipper experience with our comprehensive dashboard
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <Link href="/clippers/dashboard">
                        <Button size="lg" className="shadow-lg">
                          <Home className="w-4 h-4 mr-2" />
                          Go to Dashboard
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                      <Link href="/clippers/onboarding">
                        <Button variant="outline" size="lg">
                          <BookOpen className="w-4 h-4 mr-2" />
                          Start Tutorial
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-16"
            >
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
                        <li>• Multi-platform support (TikTok, YouTube, Instagram, X)</li>
                        <li>• PayPal integration for payments</li>
                        <li>• Real-time leaderboards</li>
                        <li>• Social account verification</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Technology Stack</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Next.js 14 with App Router</li>
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
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
