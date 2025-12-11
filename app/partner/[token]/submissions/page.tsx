"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import {
  Eye,
  ExternalLink,
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Play,
  Calendar,
  TrendingUp
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getPlatformLogo } from "@/components/ui/icons/platform-logos"

interface Submission {
  id: string
  clipUrl: string
  platform: string
  status: string
  creatorName: string
  creatorImage: string | null
  campaignTitle: string
  initialViews: number
  currentViews: number
  viewsGained: number
  submittedAt: string
}

interface SubmissionsData {
  partnerName: string
  submissions: Submission[]
  stats: {
    total: number
    approved: number
    pending: number
    rejected: number
  }
}

export default function PartnerSubmissionsPage() {
  const params = useParams()
  const token = params.token as string
  
  const [data, setData] = useState<SubmissionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [platformFilter, setPlatformFilter] = useState<string>("all")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/partner/${token}/submissions`)
        if (response.ok) {
          const result = await response.json()
          setData(result)
        } else {
          setError("Unable to load submissions")
        }
      } catch (err) {
        setError("Connection error")
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchData()
    }
  }, [token])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'PAID':
        return (
          <Badge className="bg-foreground text-background">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )
      case 'PENDING':
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge variant="secondary">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <Play className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{error || "Unable to load submissions"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get unique platforms
  const platforms = [...new Set(data.submissions.map(s => s.platform))]

  const filteredSubmissions = data.submissions.filter(sub => {
    const matchesSearch = 
      sub.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.campaignTitle.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "APPROVED" && (sub.status === "APPROVED" || sub.status === "PAID")) ||
      sub.status === statusFilter
    const matchesPlatform = platformFilter === "all" || sub.platform === platformFilter
    return matchesSearch && matchesStatus && matchesPlatform
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Content Submissions</h1>
        <p className="text-muted-foreground">
          View all content submitted to your campaigns.
        </p>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter("all")}>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold">{data.stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Submissions</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter("APPROVED")}>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold">{data.stats.approved}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter("PENDING")}>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold">{data.stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter("REJECTED")}>
          <CardContent className="pt-4 pb-4">
            <p className="text-2xl font-bold">{data.stats.rejected}</p>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-col sm:flex-row gap-4 mb-6"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by creator or campaign..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {platforms.map(platform => (
            <Button
              key={platform}
              variant={platformFilter === platform ? "default" : "outline"}
              size="sm"
              onClick={() => setPlatformFilter(platformFilter === platform ? "all" : platform)}
              className="gap-1"
            >
              {getPlatformLogo(platform, '', 14)}
              {platform}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No submissions found</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== "all" || platformFilter !== "all"
                ? "Try adjusting your filters" 
                : "Submissions will appear here once creators post content"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSubmissions.map((submission, index) => (
            <motion.div
              key={submission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.03 }}
            >
              <Card className="hover:bg-muted/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Creator Avatar */}
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={submission.creatorImage || undefined} />
                      <AvatarFallback className="text-sm">
                        {submission.creatorName[0] || '?'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Creator & Campaign Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{submission.creatorName}</p>
                        {getStatusBadge(submission.status)}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {submission.campaignTitle}
                      </p>
                    </div>

                    {/* Platform */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getPlatformLogo(submission.platform, '', 20)}
                    </div>

                    {/* Views */}
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <p className="font-medium">{submission.currentViews.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">views</p>
                    </div>

                    {/* Views Gained */}
                    {submission.viewsGained > 0 && (
                      <div className="text-right flex-shrink-0 hidden md:block">
                        <p className="font-medium flex items-center gap-1 justify-end">
                          <TrendingUp className="w-3 h-3" />
                          +{submission.viewsGained.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">tracked</p>
                      </div>
                    )}

                    {/* Date */}
                    <div className="text-right flex-shrink-0 hidden lg:block">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Link */}
                    <a
                      href={submission.clipUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0"
                    >
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
