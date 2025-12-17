"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ExternalLink, Play, Eye, TrendingUp, Check, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface ContentItem {
  id: string
  url: string
  platform: "youtube" | "tiktok" | "instagram"
  thumbnail?: string
  title?: string
  creator: string
  date: string
  views: number
  category?: string
  videoId?: string
}

const contentData: ContentItem[] = [
  { id: "content-1", creator: "Entrepreneur Clips", url: "https://www.youtube.com/watch?v=aYvYBL2oKdo", platform: "youtube", date: "09-02-2025", views: 6, videoId: "aYvYBL2oKdo" },
  { id: "content-2", creator: "cardiofieldera", url: "https://www.tiktok.com/@cardiofieldera/video/7545557577111702797", platform: "tiktok", date: "09-02-2025", views: 7 },
  { id: "content-3", creator: "Entrepreneur Clips", url: "https://www.youtube.com/watch?v=O_XjYf06WJg", platform: "youtube", date: "09-01-2025", views: 13, videoId: "O_XjYf06WJg" },
  { id: "content-4", creator: "cardiofieldera", url: "https://www.tiktok.com/@cardiofieldera/video/7545556429323635981", platform: "tiktok", date: "09-02-2025", views: 21 },
  { id: "content-5", creator: "rockyclipper", url: "https://www.tiktok.com/@rockyclipper/video/7545559045055319351", platform: "tiktok", date: "09-02-2025", views: 67 },
  { id: "content-6", creator: "cardiofieldera", url: "https://www.tiktok.com/@cardiofieldera/video/7545173627235355917", platform: "tiktok", date: "09-01-2025", views: 99 },
  { id: "content-7", creator: "Entrepreneur Clips", url: "https://www.youtube.com/watch?v=PeLmYsFLUqQ", platform: "youtube", date: "09-03-2025", views: 107, videoId: "PeLmYsFLUqQ" },
  { id: "content-8", creator: "Rod Khleif Short", url: "https://www.youtube.com/watch?v=9iLxibl2qRM", platform: "youtube", date: "09-03-2025", views: 118, videoId: "9iLxibl2qRM" },
  { id: "content-9", creator: "cardiofieldera", url: "https://www.tiktok.com/@cardiofieldera/video/7545174662817254711", platform: "tiktok", date: "09-01-2025", views: 124, category: "Company Culture" },
  { id: "content-10", creator: "hustlemind.ed", url: "https://www.instagram.com/reel/DOHZq1vkuWp", platform: "instagram", date: "09-02-2025", views: 590, category: "Company Culture" },
  { id: "content-11", creator: "hustlemind.ed", url: "https://www.instagram.com/reel/DOIEOqhiJpg", platform: "instagram", date: "09-03-2025", views: 612, category: "Company Culture" },
  { id: "content-12", creator: "hustlemind.ed", url: "https://www.instagram.com/reel/DOIxEqlEmpf", platform: "instagram", date: "09-03-2025", views: 790, category: "Storytime" },
  { id: "content-13", creator: "hustlemind.ed", url: "https://www.instagram.com/reel/DOJqYTWkt9b", platform: "instagram", date: "09-03-2025", views: 743, category: "Storytime" },
  { id: "content-14", creator: "rockyclipper", url: "https://www.tiktok.com/@rockyclipper/video/7545176440715627789", platform: "tiktok", date: "09-01-2025", views: 1288, category: "Agent Conflict" },
  { id: "content-15", creator: "Rock Editor", url: "https://www.youtube.com/watch?v=Rp96Nn90wIc", platform: "youtube", date: "09-02-2025", views: 1277, category: "Storytime", videoId: "Rp96Nn90wIc" },
  { id: "content-16", creator: "Rock Editor", url: "https://www.youtube.com/watch?v=1_hbODOOrFU", platform: "youtube", date: "09-01-2025", views: 1344, category: "Agent Conflict", videoId: "1_hbODOOrFU" },
  { id: "content-17", creator: "3rorkun", url: "https://www.instagram.com/reel/DODDNNMj3IU", platform: "instagram", date: "09-01-2025", views: 1570, category: "Company Culture" },
  { id: "content-18", creator: "Owning Manhattan Clips", url: "https://www.youtube.com/watch?v=8nfwDJrdY5Y", platform: "youtube", date: "09-03-2025", views: 1567, category: "Deal Making", videoId: "8nfwDJrdY5Y" },
  { id: "content-19", creator: "Owning Manhattan Clips", url: "https://www.youtube.com/watch?v=rkQLMHrqoLw", platform: "youtube", date: "09-03-2025", views: 1584, category: "Company Culture", videoId: "rkQLMHrqoLw" },
  { id: "content-20", creator: "Owning Manhattan Clips", url: "https://www.youtube.com/watch?v=Q9_8FtQ5Fys", platform: "youtube", date: "09-03-2025", views: 1662, category: "Company Culture", videoId: "Q9_8FtQ5Fys" },
  { id: "content-21", creator: "Entrepreneur Clips", url: "https://www.youtube.com/watch?v=kuIHpICM_P4", platform: "youtube", date: "09-01-2025", views: 1692, category: "Storytime", videoId: "kuIHpICM_P4" },
  { id: "content-22", creator: "Entrepreneur Clips", url: "https://www.youtube.com/watch?v=7PwxMevJwRw", platform: "youtube", date: "09-02-2025", views: 2258, category: "Storytime", videoId: "7PwxMevJwRw" },
  { id: "content-23", creator: "Rock Editor", url: "https://www.youtube.com/watch?v=nUR2hG9iA54", platform: "youtube", date: "09-03-2025", views: 2377, category: "Deal Making", videoId: "nUR2hG9iA54" },
  { id: "content-24", creator: "wealthbrother1", url: "https://www.instagram.com/reel/DOKpBvDCcbC", platform: "instagram", date: "09-04-2025", views: 6327, category: "Company Culture" },
  { id: "content-25", creator: "filmcharlie_", url: "https://www.instagram.com/reel/DOJRp3niP-A", platform: "instagram", date: "09-03-2025", views: 5984, category: "Storytime" },
  { id: "content-26", creator: "filmcharlie_", url: "https://www.instagram.com/reel/DOIuGaMiMCr", platform: "instagram", date: "09-03-2025", views: 15243, category: "Agent Conflict" },
  { id: "content-27", creator: "nuclearwealth", url: "https://www.instagram.com/reel/DOK-sVLkr3e", platform: "instagram", date: "09-04-2025", views: 14269, category: "Company Culture" },
  { id: "content-28", creator: "nostalgia.communiity", url: "https://www.instagram.com/reel/DOG6sgUjWYO", platform: "instagram", date: "09-02-2025", views: 17905, category: "Screen Recording / Agent Conflict" },
  { id: "content-29", creator: "the.entertainment.page_", url: "https://www.instagram.com/reel/DOKMr5gkvcX", platform: "instagram", date: "09-03-2025", views: 24593, category: "Storytime" },
  { id: "content-30", creator: "the.entertainment.page_", url: "https://www.instagram.com/reel/DOKEiQQkkgB", platform: "instagram", date: "09-03-2025", views: 23582, category: "Storytime" },
  { id: "content-31", creator: "the.entertainment.page_", url: "https://www.instagram.com/reel/DOJ_lqaEvO8", platform: "instagram", date: "09-03-2025", views: 24586, category: "Funny Moment" },
  { id: "content-32", creator: "findingoodshows", url: "https://www.instagram.com/reel/DOImBAbiPfz", platform: "instagram", date: "09-03-2025", views: 29587, category: "Deal Making" },
  { id: "content-33", creator: "soarhumor", url: "https://www.instagram.com/reel/DOJvzE7CFDT", platform: "instagram", date: "09-03-2025", views: 37658, category: "Storytime" },
  { id: "content-34", creator: "the.entertainment.page_", url: "https://www.instagram.com/reel/DOKRWK5EiMu", platform: "instagram", date: "09-04-2025", views: 40972, category: "Deal Making" },
  { id: "content-35", creator: "soarhumor", url: "https://www.instagram.com/reel/DOG3M7ZiLop", platform: "instagram", date: "09-02-2025", views: 53900, category: "Agent Conflict" },
  { id: "content-36", creator: "soarhumor", url: "https://www.instagram.com/reel/DOLEsaqiOju", platform: "instagram", date: "09-04-2025", views: 60398, category: "Storytime" },
  { id: "content-37", creator: "the.entertainment.page_", url: "https://www.instagram.com/reel/DOKCXCEkqdn", platform: "instagram", date: "09-03-2025", views: 64917, category: "Deal Making" },
  { id: "content-38", creator: "the.entertainment.page_", url: "https://www.instagram.com/reel/DOKTGhmku3e", platform: "instagram", date: "09-04-2025", views: 62915, category: "Agent Conflict" },
  { id: "content-39", creator: "nostalgia.communiity", url: "https://www.instagram.com/reel/DOJwT_xjZil", platform: "instagram", date: "09-03-2025", views: 196335, category: "Listing Feature" },
  { id: "content-40", creator: "soarhumor", url: "https://www.instagram.com/reel/DOJEHjUCH-7", platform: "instagram", date: "09-03-2025", views: 302658, category: "Listing Feature" },
  { id: "content-41", creator: "findingoodshows", url: "https://www.instagram.com/reel/DOGxW3NiA2K", platform: "instagram", date: "09-02-2025", views: 297612, category: "Deal Making" },
  { id: "content-42", creator: "findingoodshows", url: "https://www.instagram.com/reel/DOLK3AXiMER", platform: "instagram", date: "09-04-2025", views: 302853, category: "Deal Making" },
  { id: "content-43", creator: "soarhumor", url: "https://www.instagram.com/reel/DOKGK_ciO-9", platform: "instagram", date: "09-03-2025", views: 1428303, category: "Agent Conflict" },
  { id: "content-44", creator: "soarhumor", url: "https://www.instagram.com/reel/DOHMa2FiHwr", platform: "instagram", date: "09-02-2025", views: 1673605, category: "Deal Making" }
]

const whyItWorked = [
  {
    title: "Coordinated Distribution",
    description: "Hundreds of creators posting simultaneously created sustained algorithm momentum across platforms.",
  },
  {
    title: "Performance-Based Incentives",
    description: "Creators were paid based on real views, aligning incentives with results.",
  },
  {
    title: "Platform-Native Content",
    description: "Short-form formats matched native consumption behavior, increasing watch time and share velocity.",
  },
  {
    title: "Timing Discipline",
    description: "The campaign was tightly aligned with the release window, maximizing impact when attention mattered most.",
  },
]

const useThisModelIf = [
  "Tens of millions of views quickly",
  "Cost efficiency compared to paid ads",
  "Organic reach without managing creators",
  "Distribution aligned to a launch moment",
]

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case "youtube":
      return "📺"
    case "tiktok":
      return "🎵"
    case "instagram":
      return "📸"
    default:
      return "🎬"
  }
}

const getPlatformColor = (platform: string) => {
  switch (platform) {
    case "youtube":
      return "bg-red-500"
    case "tiktok":
      return "bg-gray-200"
    case "instagram":
      return "bg-gradient-to-r from-purple-500 to-pink-500"
    default:
      return "bg-gray-400"
  }
}

const formatViews = (views: number) => {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`
  }
  return views.toString()
}

export default function OwningManhattanProject() {
  const [visibleContent, setVisibleContent] = useState(16)
  const [contentItems] = useState(contentData.sort((a, b) => b.views - a.views))
  
  const loadMoreContent = () => {
    setVisibleContent(prev => Math.min(prev + 16, contentItems.length))
  }

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        loadMoreContent()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.6,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  }

  return (
    <div className="w-full bg-white text-gray-900 min-h-screen">
      
      {/* Back Link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link 
          href="/case-studies"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Case Studies
        </Link>
      </motion.div>

      {/* Hero Header */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mb-12"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <Badge variant="outline" className="text-xs text-gray-600 border-gray-300 mb-4">
            Netflix Original Series
          </Badge>
          <div className="flex justify-center mb-6">
            <Image
              src="https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/owningmanhattan.avif"
              alt="Owning Manhattan"
              width={300}
              height={300}
              className="w-48 h-48 sm:w-64 sm:h-64 rounded-2xl object-cover ring-2 ring-black/10"
              unoptimized
            />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-light mb-4">
            Owning Manhattan
          </h1>
        </motion.div>
      </motion.div>

      {/* Overview Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="mb-16 max-w-4xl mx-auto"
      >
        <h2 className="text-2xl font-light mb-6">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-sm">
          <div>
            <p className="text-muted-foreground">Client</p>
            <p className="font-normal">Ryan Serhant / Owning Manhattan</p>
          </div>
          <div>
            <p className="text-muted-foreground">Platform</p>
            <p className="font-normal">Netflix</p>
          </div>
          <div>
            <p className="text-muted-foreground">Campaign Type</p>
            <p className="font-normal">Organic Launch Amplification</p>
          </div>
          <div>
            <p className="text-muted-foreground">Partner</p>
            <p className="font-normal">Swivi Media</p>
          </div>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          <span className="font-normal text-foreground">Objective:</span> Drive large-scale organic reach during Season 2 release window
        </p>
      </motion.section>

      {/* The Challenge */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="mb-16 max-w-4xl mx-auto"
      >
        <h2 className="text-2xl font-light mb-6">The Challenge</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Streaming releases compete for attention in a saturated media environment.
        </p>
        <div className="space-y-2 text-muted-foreground mb-6">
          <p>Paid ads are expensive.</p>
          <p>Influencer campaigns are fragmented.</p>
          <p>Organic reach is unpredictable at scale.</p>
        </div>
        <p className="leading-relaxed">
          The goal for Owning Manhattan Season 2 was to generate immediate, high-velocity organic visibility across short-form platforms during the launch window — without relying on traditional paid media.
        </p>
      </motion.section>

      {/* The Strategy */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="mb-16 max-w-4xl mx-auto"
      >
        <h2 className="text-2xl font-light mb-6">The Strategy</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Swivi deployed a creator-powered distribution campaign designed to compress weeks of organic reach into days.
        </p>
        <p className="mb-4">
          Instead of individual influencer placements, the campaign leveraged coordinated creator distribution at scale, optimized for:
        </p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {["Volume", "Timing", "Platform-native formats", "Performance-based incentives"].map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
              <span className="text-sm">{item}</span>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground">
          The strategy focused on saturation during the release window to maximize algorithmic lift and cultural visibility.
        </p>
      </motion.section>

      {/* Campaign Structure */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="mb-16 max-w-4xl mx-auto bg-gray-50 rounded-xl p-6 sm:p-8"
      >
        <h2 className="text-2xl font-light mb-6">Campaign Structure</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          <div>
            <p className="text-2xl font-light">{"< 7 days"}</p>
            <p className="text-sm text-muted-foreground">Duration</p>
          </div>
          <div>
            <p className="text-2xl font-light">100+</p>
            <p className="text-sm text-muted-foreground">Creators Activated</p>
          </div>
          <div>
            <p className="text-2xl font-light">Hundreds</p>
            <p className="text-sm text-muted-foreground">Posts Per Day</p>
          </div>
        </div>
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-2">Platforms</p>
          <p className="font-normal">TikTok, Instagram Reels, YouTube Shorts</p>
        </div>
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-2">Budget Model</p>
          <p className="font-normal">Performance-based (pay per view)</p>
        </div>
        <div className="pt-6 border-t border-black/5">
          <p className="text-sm text-muted-foreground mb-3">Swivi handled:</p>
          <div className="space-y-2 text-sm">
            <p>• Creator sourcing and coordination</p>
            <p>• Content guidelines and duplication control</p>
            <p>• Approval workflows</p>
            <p>• Performance tracking and budget allocation</p>
          </div>
          <p className="mt-4 font-normal">The client remained hands-off.</p>
        </div>
      </motion.section>

      {/* Results */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="mb-16 max-w-4xl mx-auto"
      >
        <h2 className="text-2xl font-light mb-8">Results</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="text-center">
            <p className="text-3xl sm:text-4xl font-light mb-1">22M+</p>
            <p className="text-sm text-muted-foreground">Organic Views</p>
          </div>
          <div className="text-center">
            <p className="text-3xl sm:text-4xl font-light mb-1">{"<$1"}</p>
            <p className="text-sm text-muted-foreground">Effective Cost Per 1K Views</p>
          </div>
          <div className="text-center">
            <p className="text-3xl sm:text-4xl font-light mb-1">{"<7 days"}</p>
            <p className="text-sm text-muted-foreground">To Saturation</p>
          </div>
          <div className="text-center">
            <p className="text-3xl sm:text-4xl font-light mb-1">600+</p>
            <p className="text-sm text-muted-foreground">Posts Created</p>
          </div>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          The campaign delivered reach comparable to large paid media buys — at a fraction of the cost and timeline.
        </p>
      </motion.section>

      {/* Why It Worked */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="mb-16 max-w-4xl mx-auto"
      >
        <h2 className="text-2xl font-light mb-8">Why It Worked</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {whyItWorked.map((item, index) => (
            <div key={index}>
              <h3 className="font-normal mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* The Takeaway */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="mb-16 max-w-4xl mx-auto bg-gray-50 rounded-xl p-6 sm:p-8"
      >
        <h2 className="text-2xl font-light mb-6">The Takeaway</h2>
        <p className="leading-relaxed mb-6">
          This campaign demonstrates how creator-powered organic distribution can operate as a true media channel — delivering predictable reach, cost efficiency, and speed at scale.
        </p>
        <p className="text-muted-foreground mb-4">The model is repeatable across:</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p>• Streaming releases</p>
          <p>• Product launches</p>
          <p>• Brand announcements</p>
          <p>• Founder visibility campaigns</p>
        </div>
      </motion.section>

      {/* Use This Model If */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="mb-16 max-w-4xl mx-auto"
      >
        <h2 className="text-2xl font-light mb-6">Use This Model If You Need:</h2>
        <div className="space-y-3">
          {useThisModelIf.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="mb-16 max-w-4xl mx-auto text-center py-12 border-y border-black/5"
      >
        <p className="text-lg text-muted-foreground mb-2">Planning a launch or release?</p>
        <p className="text-xl font-normal mb-8">Deploy creator-powered distribution when timing matters most.</p>
        <Button size="lg" className="font-normal bg-gray-900 text-white hover:bg-gray-800">
          <Link href="https://calendly.com/bykevingeorge/30min?month=2025-05" target="_blank" rel="noopener noreferrer" className="flex items-center">
            Launch a Campaign
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </motion.section>

      {/* Content Gallery */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mb-12"
      >
        <h2 className="text-2xl font-light mb-8 max-w-4xl mx-auto">Campaign Content</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 max-w-6xl mx-auto px-4">
          <AnimatePresence>
            {contentItems.slice(0, visibleContent).map((item, index) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                layout
              >
                <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-0">
                  <CardContent className="p-0">
                    <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                      {/* YouTube Thumbnail */}
                      {item.platform === "youtube" && item.videoId && (
                        <img
                          src={`https://img.youtube.com/vi/${item.videoId}/maxresdefault.jpg`}
                          alt={`${item.creator} video thumbnail`}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`;
                          }}
                        />
                      )}
                      
                      {/* Instagram Thumbnail */}
                      {item.platform === "instagram" && (
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <div className="relative">
                            <div className="w-16 h-16 bg-white/20 rounded-xl backdrop-blur-sm flex items-center justify-center">
                              <div className="text-3xl">📸</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TikTok Thumbnail */}
                      {item.platform === "tiktok" && (
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                          <div className="relative">
                            <div className="w-16 h-16 bg-white/20 rounded-xl backdrop-blur-sm flex items-center justify-center">
                              <div className="text-3xl">🎵</div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Platform Icon Overlay */}
                      <div className="absolute top-2 left-2 z-10">
                        <div className={`${getPlatformColor(item.platform)} ${item.platform === 'tiktok' ? 'text-gray-800' : 'text-white'} text-xs px-2 py-1 rounded-full flex items-center gap-1`}>
                          <span className="text-xs">{getPlatformIcon(item.platform)}</span>
                          <span className="capitalize hidden sm:inline">{item.platform}</span>
                        </div>
                      </div>

                      {/* View Count Badge */}
                      <div className="absolute top-2 right-2 z-10">
                        <div className="bg-black/90 text-white text-xs px-2 py-1.5 rounded-full flex items-center gap-1 backdrop-blur-sm min-w-0">
                          <Eye className="h-3 w-3 flex-shrink-0" />
                          <span className="font-medium whitespace-nowrap">{formatViews(item.views)}</span>
                        </div>
                      </div>

                      {/* Play Button */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 group-hover:scale-110 transition-transform">
                          <Play className="h-6 w-6 text-gray-800 fill-current" />
                        </div>
                      </div>

                      {/* Content Preview Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Creator Info */}
                      <div className="absolute bottom-2 left-2 right-2 z-10">
                        <div className="text-white text-xs font-medium drop-shadow-lg truncate">
                          @{item.creator}
                        </div>
                      </div>
                    </div>

                    {/* Content Info */}
                    <div className="p-3 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-sm truncate text-gray-900 flex-1 mr-2">
                          {item.creator}
                        </h3>
                        <span className="text-xs text-gray-600 whitespace-nowrap">
                          {item.date}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                          asChild
                        >
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Open </span>{item.platform}
                          </a>
                        </Button>
                        <div className="flex items-center gap-1 text-xs font-medium text-green-600 justify-center sm:justify-start">
                          <TrendingUp className="h-3 w-3" />
                          {formatViews(item.views)} views
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Load More */}
        {visibleContent < contentItems.length && (
          <motion.div variants={itemVariants} className="text-center mt-8">
            <Button
              onClick={loadMoreContent}
              variant="outline"
              className="px-8 py-3"
            >
              Load More Content ({contentItems.length - visibleContent} remaining)
            </Button>
          </motion.div>
        )}

        {/* Stats Summary */}
        <motion.div variants={itemVariants} className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Showing {Math.min(visibleContent, contentItems.length)} of {contentItems.length} pieces of content created for this campaign
          </p>
        </motion.div>
      </motion.section>

    </div>
  )
}
