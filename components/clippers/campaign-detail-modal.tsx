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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  Clock,
  AlertCircle
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
      
      toast.success("Clip submitted successfully! View tracking has started. You'll be notified once it's reviewed.")
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

  const isCampaignCompleted = campaign.status === 'COMPLETED'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-medium text-foreground">
                {campaign.title}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">by {campaign.creator}</p>
            </div>
            {isCampaignCompleted && (
              <Badge className="bg-green-600 text-white">
                <CheckCircle className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Campaign Completed Alert */}
          {isCampaignCompleted && (
            <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">Campaign Completed</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                This campaign has reached its budget limit and is no longer accepting submissions. 
                All earnings have been finalized and are ready for payout.
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Form - Compact */}
          {!isCampaignCompleted && (
          <div className="border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="w-4 h-4 text-foreground" />
              <h3 className="text-base font-medium text-foreground">Submit Your Clip</h3>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="platform" className="text-sm text-foreground">Platform</Label>
                  <Select onValueChange={(value) => setValue("platform", value as any)}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaign.platforms.map((platform) => {
                        const Icon = platformIcons[platform as keyof typeof platformIcons]
                        return (
                          <SelectItem key={platform} value={platform}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-3 h-3" />
                              <span className="capitalize text-xs">{platform}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  {errors.platform && (
                    <p className="text-destructive text-xs mt-1">{errors.platform.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="clipUrl" className="text-sm text-foreground">Content URL</Label>
                  <div className="relative mt-1">
                    <Input
                      id="clipUrl"
                      placeholder={getPlatformPlaceholder(selectedPlatform)}
                      className="h-9 text-sm"
                      {...register("clipUrl")}
                    />
                  </div>
                  {errors.clipUrl && (
                    <p className="text-destructive text-xs mt-1">{errors.clipUrl.message}</p>
                  )}
                </div>
              </div>
              {selectedPlatform && (
                <p className="text-xs text-muted-foreground">
                  {getPlatformHint(selectedPlatform)}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-9"
                  size="sm"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  size="sm"
                  className="h-9"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
          )}

          {/* Campaign Info - Compact */}
          <div className="border border-border rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <div className="text-xs text-muted-foreground">Budget</div>
                <div className="text-sm font-medium text-foreground">${campaign.pool.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Rate/1K views</div>
                <div className="text-sm font-medium text-foreground">${campaign.cpm}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Submissions</div>
                <div className="text-sm font-medium text-foreground">{campaign.totalSubmissions}</div>
              </div>
            </div>
            
            {/* Platforms */}
            <div className="mb-3">
              <div className="text-xs text-muted-foreground mb-2">Platforms</div>
              <div className="flex gap-2">
                {campaign.platforms.map((platform) => {
                  const Icon = platformIcons[platform as keyof typeof platformIcons]
                  return (
                    <div key={platform} className="flex items-center gap-1 bg-muted rounded px-2 py-1">
                      <Icon className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs capitalize text-foreground">{platform}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="text-xs text-muted-foreground mb-2">Description</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {campaign.description}
              </p>
            </div>
          </div>

          {/* Requirements */}
          {campaign.requirements.length > 0 && (
            <div className="border border-border rounded-lg p-4">
              <div className="text-xs text-muted-foreground mb-2">Requirements</div>
              <div className="space-y-2">
                {campaign.requirements.map((req, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 text-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground leading-relaxed">{req}</span>
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
