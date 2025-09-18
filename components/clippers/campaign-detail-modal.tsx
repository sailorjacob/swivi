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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success("Clip submitted successfully! You'll be notified once it's reviewed.")
      reset()
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to submit clip. Please try again.")
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

  if (!campaign) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Campaign Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Image */}
            <div className="relative h-64 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg overflow-hidden">
              <div className="absolute top-4 left-4">
                <Badge className="bg-green-500 text-white">
                  🔴 LIVE
                </Badge>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <h2 className="text-2xl font-bold text-white text-center px-4">
                  {campaign.title}
                </h2>
              </div>
            </div>

            {/* Campaign Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-foreground text-background">
                    P
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground">Created by {campaign.creator}</span>
              </div>

              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-light">{campaign.title}</DialogTitle>
              </DialogHeader>

              <p className="text-muted-foreground leading-relaxed mb-6">
                {campaign.description}
              </p>
            </div>

            {/* Requirements */}
            {campaign.requirements.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3">Campaign Guidelines</h3>
                <div className="space-y-2">
                  {campaign.requirements.map((req, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content Sources */}
            {campaign.contentSources.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3">Content Sources</h3>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-3">
                    Use the provided content sources as your base material:
                  </p>
                  <div className="space-y-1">
                    {campaign.contentSources.map((source, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-foreground rounded-full" />
                        <span className="text-sm text-foreground">{source}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Form */}
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-medium mb-4">Submit Your Clip</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="clipUrl">Clip URL</Label>
                  <div className="relative mt-1">
                    <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="clipUrl"
                      placeholder="https://tiktok.com/@user/video/123"
                      className="pl-10"
                      {...register("clipUrl")}
                    />
                  </div>
                  {errors.clipUrl && (
                    <p className="text-red-500 text-sm mt-1">{errors.clipUrl.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="platform">Platform</Label>
                  <Select onValueChange={(value) => setValue("platform", value as any)}>
                    <SelectTrigger className="mt-1">
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
                    <p className="text-red-500 text-sm mt-1">{errors.platform.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? "Submitting..." : "Submit Clip"}
                </Button>
              </form>
            </div>
          </div>

          {/* Right Column - Overview Stats */}
          <div className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-medium">Overview</h3>
              </div>

              <div className="space-y-4">
                {/* Pool */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Pool</span>
                    <span className="text-xl font-bold text-green-500">
                      {formatCurrency(campaign.spent)}
                    </span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage(campaign.spent, campaign.pool)}%` }}
                    />
                  </div>
                </div>

                <Separator />

                {/* Total Budget */}
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-sm text-muted-foreground">Total Budget</span>
                  <span className="text-lg font-bold text-green-500">
                    {formatCurrency(campaign.pool)}
                  </span>
                </div>

                {/* Title */}
                <div className="p-3 bg-background rounded-lg">
                  <span className="text-sm text-muted-foreground block mb-1">Title</span>
                  <span className="text-sm font-medium">{campaign.title}</span>
                </div>

                {/* CPM */}
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-sm text-muted-foreground">CPM</span>
                  <span className="text-lg font-bold">${campaign.cpm}</span>
                </div>

                {/* Accepted Platforms */}
                <div className="p-3 bg-background rounded-lg">
                  <span className="text-sm text-muted-foreground block mb-2">Accepted platforms</span>
                  <div className="flex gap-2">
                    {campaign.platforms.map((platform) => {
                      const Icon = platformIcons[platform as keyof typeof platformIcons]
                      return (
                        <div key={platform} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-sm text-muted-foreground">Total Links Submitted</span>
                  <span className="text-lg font-bold">{campaign.totalSubmissions}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-sm text-muted-foreground">Total Views</span>
                  <span className="text-lg font-bold">{campaign.totalViews}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
