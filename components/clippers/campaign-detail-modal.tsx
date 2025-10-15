"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { 
  DollarSign, 
  TrendingUp, 
  Users,
  Link2,
  Music,
  Instagram,
  Youtube,
  Twitter,
  CheckCircle,
  Clock
} from "lucide-react"
import toast from "react-hot-toast"
import { authenticatedFetch } from "@/lib/supabase-browser"

const submitSchema = z.object({
  clipUrl: z.string().url("Please enter a valid URL"),
  platform: z.enum(["tiktok", "instagram", "youtube", "twitter"], {
    errorMap: () => ({ message: "Please select a platform" }),
  }),
})

interface Campaign {
  id: string
  title: string
  creator: string
  description: string
  image: string
  pool: number
  spent: number
  cpm: number
  platforms: string[]
  totalSubmissions: number
  totalViews: number
  status: string
  requirements: string[]
  contentSources: string[]
}

interface CampaignDetailModalProps {
  campaign: Campaign | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const platformIcons = {
  tiktok: Music,
  instagram: Instagram,
  youtube: Youtube,
  twitter: Twitter,
}

export function CampaignDetailModal({ campaign, open, onOpenChange }: CampaignDetailModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<z.infer<typeof submitSchema>>({
    resolver: zodResolver(submitSchema),
  })

  const selectedPlatform = watch("platform")

  const onSubmit = async (data: z.infer<typeof submitSchema>) => {
    setIsSubmitting(true)
    
    try {
      const submissionData = {
        campaignId: campaign?.id,
        clipUrl: data.clipUrl,
        platform: data.platform.toUpperCase(),
      }

      const response = await authenticatedFetch("/api/clippers/submissions", {
        method: "POST",
        body: JSON.stringify(submissionData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit clip")
      }
      
      toast.success("Clip submitted successfully! You'll be notified once it's reviewed.")
      reset()
      onOpenChange(false)
    } catch (error) {
      console.error("Submission error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to submit clip. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getProgressPercentage = (spent: number, pool: number) => {
    return pool > 0 ? (spent / pool) * 100 : 0
  }

  const getPlatformPlaceholder = (platform: string) => {
    switch (platform) {
      case "tiktok":
        return "https://tiktok.com/@username/video/123456789"
      case "youtube":
        return "https://youtube.com/shorts/ABC123def456"
      case "instagram":
        return "https://instagram.com/reel/ABC123def456"
      case "twitter":
        return "https://x.com/username/status/123456789"
      default:
        return "https://tiktok.com/@username/video/123456789"
    }
  }

  const getPlatformHint = (platform: string) => {
    switch (platform) {
      case "tiktok":
        return "Copy the TikTok video URL from the share button"
      case "youtube":
        return "Use YouTube Shorts URL (youtube.com/shorts/...)"
      case "instagram":
        return "Copy Instagram Reel URL from the share button"
      case "twitter":
        return "Copy the X (Twitter) post URL from the share button"
      default:
        return "Copy the video URL from the platform's share button"
    }
  }

  if (!campaign) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <div className="space-y-6">
          {/* Header */}
          <div className="relative h-32 bg-muted rounded-lg overflow-hidden">
            <div className="absolute top-4 left-4">
              <Badge className="bg-foreground text-background">
                LIVE
              </Badge>
            </div>
            <img
              src={campaign.image || "/placeholder-campaign.jpg"}
              alt={campaign.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder-campaign.jpg"
              }}
            />
            <div className="absolute inset-0 bg-black/40 flex items-end">
              <div className="p-4">
                <h2 className="text-xl font-light text-white mb-1">
                  {campaign.title}
                </h2>
                <p className="text-white/80 text-sm">by {campaign.creator}</p>
              </div>
            </div>
          </div>

          {/* Submit Form - Moved to Top */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Link2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">Submit Your Clip</h3>
                <p className="text-sm text-muted-foreground">Ready to earn? Submit your content link below</p>
              </div>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="platform" className="text-white font-medium">Platform</Label>
                  <Select onValueChange={(value) => setValue("platform", value as any)}>
                    <SelectTrigger className="mt-1 bg-background/50">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaign.platforms.map((platform) => {
                        const Icon = platformIcons[platform as keyof typeof platformIcons]
                        return (
                          <SelectItem key={platform} value={platform}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              <span className="capitalize">{platform}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  {errors.platform && (
                    <p className="text-red-400 text-sm mt-1">{errors.platform.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="clipUrl" className="text-white font-medium">Content URL</Label>
                  <div className="relative mt-1">
                    <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="clipUrl"
                      placeholder={getPlatformPlaceholder(selectedPlatform)}
                      className="pl-10 bg-background/50"
                      {...register("clipUrl")}
                    />
                  </div>
                  {errors.clipUrl && (
                    <p className="text-red-400 text-sm mt-1">{errors.clipUrl.message}</p>
                  )}
                  {selectedPlatform && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {getPlatformHint(selectedPlatform)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  size="lg"
                >
                  {isSubmitting ? "Submitting..." : "Submit Clip & Start Earning"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>

          {/* Campaign Description */}
          <div>
            <h3 className="text-lg font-medium text-white mb-2">About This Campaign</h3>
            <p className="text-muted-foreground leading-relaxed">
              {campaign.description}
            </p>
          </div>

          {/* Campaign Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Pool Budget</div>
              <div className="text-xl font-medium text-white">${campaign.pool.toLocaleString()}</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Rate per 1K views</div>
              <div className="text-xl font-medium text-white">${campaign.cpm}</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Submissions</div>
              <div className="text-xl font-medium text-white">{campaign.totalSubmissions}</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Status</div>
              <div className="text-xl font-medium text-white">{campaign.status}</div>
            </div>
          </div>

          {/* Platforms */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Accepted Platforms</h3>
            <div className="flex gap-3">
              {campaign.platforms.map((platform) => {
                const Icon = platformIcons[platform as keyof typeof platformIcons]
                return (
                  <div key={platform} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm capitalize text-white">{platform}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Requirements */}
          {campaign.requirements.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Requirements</h3>
              <div className="space-y-2">
                {campaign.requirements.map((req, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{req}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  )
}
