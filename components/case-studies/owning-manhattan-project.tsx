"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ExternalLink, Play, Eye, TrendingUp } from "lucide-react"
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
      return "bg-red-600"
    case "tiktok":
      return "bg-black"
    case "instagram":
      return "bg-gradient-to-r from-purple-600 to-pink-600"
    default:
      return "bg-gray-600"
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
  const [visibleContent, setVisibleContent] = useState(16) // Start with 4x4 grid
  const [contentItems] = useState(contentData.sort((a, b) => b.views - a.views)) // Sort by views descending
  
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
        ease: "easeOut",
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
        ease: "easeOut",
      },
    },
  }

  return (
    <div className="w-full">
      {/* Header */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mb-12"
      >
        <motion.div variants={itemVariants} className="mb-6">
          <Link 
            href="/case-studies"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Case Studies
          </Link>
        </motion.div>

        <motion.div variants={itemVariants} className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/owningmanhattan.avif"
              alt="Owning Manhattan"
              width={400}
              height={400}
              className="rounded-2xl object-cover ring-2 ring-black/10 shadow-lg"
              unoptimized
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-light mb-3">
            Owning Manhattan <span className="font-normal">Campaign</span>
          </h1>
          <div className="flex items-center justify-center gap-3">
            <Badge variant="outline" className="text-xs">Netflix TV Series</Badge>
            <span className="text-2xl">📸</span>
            <span className="text-sm text-muted-foreground">2 days • 6.1M views • 610% ROI</span>
          </div>
        </motion.div>

        <motion.p variants={itemVariants} className="text-lg text-muted-foreground max-w-3xl mx-auto text-center mb-8">
          Netflix series promotion campaign targeting real estate and lifestyle audiences. 
          Our clipper network created viral content showcasing the luxury real estate and drama 
          from Netflix's hit series, achieving exceptional reach and engagement.
        </motion.p>

        {/* Campaign Results Summary */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-gray-50 rounded-xl p-6 mt-8 mb-8 max-w-6xl mx-auto"
        >
          <motion.h3 variants={itemVariants} className="text-lg font-light mb-4">
            Campaign Impact
          </motion.h3>
          <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2">Reach & Engagement</h4>
              <p className="text-sm text-muted-foreground">
                Generated 6.1M+ views across all platforms with high engagement rates, 
                significantly exceeding the initial goal of 1M views.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Content Diversity</h4>
              <p className="text-sm text-muted-foreground">
                Created content across YouTube, TikTok, and Instagram, ensuring 
                maximum platform optimization and audience reach.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">ROI Achievement</h4>
              <p className="text-sm text-muted-foreground">
                Delivered exceptional 610% return on investment within just 2 days, 
                demonstrating the power of our clipper network.
              </p>
            </div>
          </motion.div>
        </motion.section>

        {/* Campaign Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 mb-8 max-w-6xl mx-auto">
          <div className="text-center">
            <div className="text-2xl font-light mb-1">49</div>
            <div className="text-sm text-muted-foreground">Clips Created</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-light mb-1">6.1M</div>
            <div className="text-sm text-muted-foreground">Total Views</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-light mb-1">610%</div>
            <div className="text-sm text-muted-foreground">ROI Achieved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-light mb-1">$1,000</div>
            <div className="text-sm text-muted-foreground">Total Budget</div>
          </div>
        </motion.div>
      </motion.div>

      {/* Content Gallery */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mb-12"
      >

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 max-w-6xl mx-auto">
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
                <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
                      {/* YouTube Thumbnail */}
                      {item.platform === "youtube" && item.videoId && (
                        <img
                          src={`https://img.youtube.com/vi/${item.videoId}/maxresdefault.jpg`}
                          alt={`${item.creator} video thumbnail`}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to medium quality thumbnail
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
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                              <div className="text-xs text-white">IG</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TikTok Thumbnail */}
                      {item.platform === "tiktok" && (
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                          <div className="relative">
                            <div className="w-16 h-16 bg-white/10 rounded-xl backdrop-blur-sm flex items-center justify-center">
                              <div className="text-3xl">🎵</div>
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-black rounded-full border-2 border-white flex items-center justify-center">
                              <div className="text-xs text-white font-bold">T</div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Platform Icon Overlay */}
                      <div className="absolute top-3 left-3 z-10">
                        <div className={`${getPlatformColor(item.platform)} text-white text-xs px-2 py-1 rounded-full flex items-center gap-1`}>
                          <span>{getPlatformIcon(item.platform)}</span>
                          <span className="capitalize">{item.platform}</span>
                        </div>
                      </div>

                      {/* View Count Badge */}
                      <div className="absolute top-3 right-3 z-10">
                        <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{formatViews(item.views)}</span>
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
                      <div className="absolute bottom-3 left-3 z-10">
                        <div className="text-white text-xs font-medium">
                          @{item.creator}
                        </div>
                      </div>
                    </div>

                    {/* Content Info */}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-sm truncate">
                          {item.creator}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {item.date}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 flex-1 mr-2"
                          asChild
                        >
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Open {item.platform}
                          </a>
                        </Button>
                        <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                          <TrendingUp className="h-3 w-3" />
                          {formatViews(item.views)}
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
