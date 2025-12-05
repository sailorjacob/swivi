"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { authenticatedFetch } from "@/lib/supabase-browser"
import toast from "react-hot-toast"
import { 
  X, 
  Trophy, 
  Clock, 
  CheckCircle2, 
  Crown,
  Award,
  Sparkles,
  Loader2,
  Upload,
  ArrowLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface BonusTier {
  name: string
  icon: React.ReactNode
  reward: string
  totalPayout: string
  spots?: number
  spotsRemaining?: number
  requirements: string[]
  description: string
  deadline?: string
  highlight?: boolean
  tierValue: "TIER_1_HIGH_VOLUME" | "TIER_2_QUALITY"
}

interface CampaignBonusModalProps {
  isOpen: boolean
  onClose: () => void
  campaign?: {
    id: string
    title: string
    totalBudget: number
    bonusBudget: number
    payoutRate: string
  }
}

const defaultCampaign = {
  id: "",
  title: "Owning Manhattan Season 2",
  totalBudget: 20000,
  bonusBudget: 2000,
  payoutRate: "$1 per 1,000 views"
}

const applicationSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  platform: z.enum(["TIKTOK", "YOUTUBE", "INSTAGRAM"], {
    errorMap: () => ({ message: "Please select a platform" })
  }),
  profileLink: z.string().url("Valid profile URL is required"),
  tier: z.enum(["TIER_1_HIGH_VOLUME", "TIER_2_QUALITY"]),
  clipLinks: z.string().min(1, "At least one clip link is required"),
  paymentAddress: z.string().min(1, "PayPal email or BTC address is required"),
})

type ApplicationFormData = z.infer<typeof applicationSchema>

export function CampaignBonusModal({ isOpen, onClose, campaign = defaultCampaign }: CampaignBonusModalProps) {
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [selectedTier, setSelectedTier] = useState<"TIER_1_HIGH_VOLUME" | "TIER_2_QUALITY" | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
  })

  const bonusTiers: BonusTier[] = [
    {
      name: "Tier 1 — High-Follower Volume Bounty",
      icon: <Crown className="w-5 h-5" />,
      reward: "$150 per creator",
      totalPayout: "$1,200",
      spots: 8,
      spotsRemaining: 8,
      requirements: [
        "Must have 10,000+ followers on TikTok, IG, or YouTube",
        "Must provide a screenshot + profile link for verification",
        "Post 14 Owning Manhattan clips within 7 days"
      ],
      description: "First come, first served — Only the first 8 qualifying creators get this bounty.",
      deadline: "Closes once 8 spots filled",
      highlight: true,
      tierValue: "TIER_1_HIGH_VOLUME"
    },
    {
      name: "Tier 2 — Quality Bounty",
      icon: <Award className="w-5 h-5" />,
      reward: "$40 per winning clip",
      totalPayout: "$800",
      requirements: [
        "Focus on strongest editing and viewer retention",
        "Week 1: Top 10 clips selected",
        "Week 2: Top 10 clips selected",
        "Total of 20 winning clips across both weeks"
      ],
      description: "Rewarding the strongest editing and retention. Runs for two full selection cycles.",
      deadline: "Closes once all 20 winners are paid",
      tierValue: "TIER_2_QUALITY"
    }
  ]

  const handleApplyClick = (tier: BonusTier) => {
    setSelectedTier(tier.tierValue)
    setValue("tier", tier.tierValue)
    setShowApplicationForm(true)
  }

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB")
      return
    }

    setUploadingScreenshot(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'images')

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setScreenshotUrl(result.url)
        toast.success("Screenshot uploaded")
      } else {
        toast.error("Failed to upload screenshot")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload screenshot")
    } finally {
      setUploadingScreenshot(false)
    }
  }

  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true)
    try {
      // Parse clip links (one per line)
      const clipLinks = data.clipLinks
        .split('\n')
        .map(link => link.trim())
        .filter(link => link.length > 0)

      const response = await authenticatedFetch("/api/bounty-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaign.id,
          fullName: data.fullName,
          email: data.email,
          platform: data.platform,
          profileLink: data.profileLink,
          tier: data.tier,
          followerScreenshotUrl: screenshotUrl,
          clipLinks,
          paymentAddress: data.paymentAddress,
        })
      })

      if (response.ok) {
        toast.success("Application submitted! We'll review it shortly.")
        reset()
        setShowApplicationForm(false)
        setSelectedTier(null)
        setScreenshotUrl(null)
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to submit application")
      }
    } catch (error) {
      console.error("Submit error:", error)
      toast.error("Failed to submit application")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    setShowApplicationForm(false)
    setSelectedTier(null)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl max-h-[90vh] overflow-hidden bg-card border border-border rounded-xl shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[90vh]">
              {showApplicationForm ? (
                /* APPLICATION FORM */
                <div className="px-6 py-6">
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to bounties
                  </button>

                  <h2 className="text-xl font-bold mb-1">Apply for Bounty</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    {selectedTier === "TIER_1_HIGH_VOLUME" ? "Tier 1 — High-Follower Volume" : "Tier 2 — Quality Bounty"}
                  </p>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        {...register("fullName")}
                        placeholder="Your full name"
                        className="mt-1"
                      />
                      {errors.fullName && (
                        <p className="text-sm text-red-500 mt-1">{errors.fullName.message}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register("email")}
                        placeholder="your@email.com"
                        className="mt-1"
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    {/* Platform */}
                    <div>
                      <Label>Platform *</Label>
                      <Select onValueChange={(value) => setValue("platform", value as any)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TIKTOK">TikTok</SelectItem>
                          <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                          <SelectItem value="YOUTUBE">YouTube</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.platform && (
                        <p className="text-sm text-red-500 mt-1">{errors.platform.message}</p>
                      )}
                    </div>

                    {/* Profile Link */}
                    <div>
                      <Label htmlFor="profileLink">Profile Link *</Label>
                      <Input
                        id="profileLink"
                        {...register("profileLink")}
                        placeholder="https://tiktok.com/@yourusername"
                        className="mt-1"
                      />
                      {errors.profileLink && (
                        <p className="text-sm text-red-500 mt-1">{errors.profileLink.message}</p>
                      )}
                    </div>

                    {/* Follower Screenshot (for Tier 1) */}
                    {selectedTier === "TIER_1_HIGH_VOLUME" && (
                      <div>
                        <Label>Follower Count Screenshot *</Label>
                        <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4">
                          {screenshotUrl ? (
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                              <span className="text-sm">Screenshot uploaded</span>
                              <button
                                type="button"
                                onClick={() => setScreenshotUrl(null)}
                                className="text-sm text-muted-foreground hover:text-foreground ml-auto"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <label className="cursor-pointer flex flex-col items-center gap-2">
                              {uploadingScreenshot ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                              ) : (
                                <Upload className="w-6 h-6 text-muted-foreground" />
                              )}
                              <span className="text-sm text-muted-foreground">
                                Click to upload screenshot
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleScreenshotUpload}
                                className="hidden"
                                disabled={uploadingScreenshot}
                              />
                            </label>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Max 10MB. PNG, JPG, or WEBP</p>
                      </div>
                    )}

                    {/* Clip Links */}
                    <div>
                      <Label htmlFor="clipLinks">Link to Posted Clips *</Label>
                      <Textarea
                        id="clipLinks"
                        {...register("clipLinks")}
                        placeholder="Paste your clip URLs (one per line)&#10;https://tiktok.com/...&#10;https://tiktok.com/..."
                        className="mt-1 min-h-[100px]"
                      />
                      {errors.clipLinks && (
                        <p className="text-sm text-red-500 mt-1">{errors.clipLinks.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">One URL per line</p>
                    </div>

                    {/* Payment Address */}
                    <div>
                      <Label htmlFor="paymentAddress">PayPal Email or BTC Address *</Label>
                      <Input
                        id="paymentAddress"
                        {...register("paymentAddress")}
                        placeholder="paypal@email.com or bc1q..."
                        className="mt-1"
                      />
                      {errors.paymentAddress && (
                        <p className="text-sm text-red-500 mt-1">{errors.paymentAddress.message}</p>
                      )}
                    </div>

                    {/* Hidden tier field */}
                    <input type="hidden" {...register("tier")} />

                    {/* Submit */}
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base font-semibold"
                      disabled={isSubmitting || (selectedTier === "TIER_1_HIGH_VOLUME" && !screenshotUrl)}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Application"
                      )}
                    </Button>
                  </form>
                </div>
              ) : (
                /* BOUNTY TIERS VIEW */
                <>
                  {/* Header */}
                  <div className="px-6 pt-6 pb-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-zinc-400/20 to-zinc-500/20 border border-zinc-400/30">
                        <Trophy className="w-6 h-6 text-zinc-300" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Performance Bounties</h2>
                        <p className="text-sm text-muted-foreground">{campaign.title}</p>
                      </div>
                    </div>
                    
                    {/* Total Bounty Amount */}
                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-zinc-400/10 via-zinc-300/10 to-zinc-400/10 border border-zinc-400/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Bounty Pool</p>
                          <p className="text-3xl font-bold bg-gradient-to-r from-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                            ${campaign.bonusBudget.toLocaleString()}
                          </p>
                        </div>
                        <Sparkles className="w-8 h-8 text-zinc-400/50" />
                      </div>
                    </div>
                  </div>

                  {/* Bounty Tiers */}
                  <div className="px-6 pb-6 space-y-4">
                    {bonusTiers.map((tier, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`rounded-xl border overflow-hidden ${
                          tier.highlight 
                            ? 'border-zinc-400/40 bg-gradient-to-br from-zinc-400/5 to-transparent' 
                            : 'border-border bg-muted/20'
                        }`}
                      >
                        {tier.highlight && (
                          <div className="px-4 py-2 bg-gradient-to-r from-zinc-300 to-zinc-400 text-black text-xs font-bold flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5" />
                            LIMITED SPOTS — FIRST COME, FIRST SERVED
                          </div>
                        )}
                        
                        <div className="p-5">
                          {/* Tier Header */}
                          <div className="flex items-start gap-3 mb-4">
                            <div className={`p-2.5 rounded-lg ${
                              tier.highlight 
                                ? 'bg-gradient-to-br from-zinc-400/20 to-zinc-500/20 border border-zinc-400/30' 
                                : 'bg-muted border border-border'
                            }`}>
                              {tier.icon}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-base">{tier.name}</h3>
                              <p className="text-sm text-muted-foreground mt-0.5">{tier.description}</p>
                            </div>
                          </div>

                          {/* Reward Stats */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="p-3 rounded-lg bg-background border border-border">
                              <p className="text-xs text-muted-foreground mb-1">Reward</p>
                              <p className="font-bold text-lg">{tier.reward}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-background border border-border">
                              <p className="text-xs text-muted-foreground mb-1">Total Pool</p>
                              <p className="font-bold text-lg">{tier.totalPayout}</p>
                            </div>
                          </div>

                          {/* Spots Progress */}
                          {tier.spots && (
                            <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border/50">
                              <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium">Spots Available</span>
                                <span className="text-muted-foreground">{tier.spotsRemaining} / {tier.spots}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-zinc-300 to-zinc-500 h-2.5 rounded-full transition-all"
                                  style={{ width: `${((tier.spots - (tier.spotsRemaining || 0)) / tier.spots) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Requirements */}
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Requirements:</p>
                            {tier.requirements.map((req, i) => (
                              <div key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-foreground/70" />
                                <span>{req}</span>
                              </div>
                            ))}
                          </div>

                          {/* Deadline */}
                          {tier.deadline && (
                            <div className="mt-4 pt-3 border-t border-border/50">
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {tier.deadline}
                              </p>
                            </div>
                          )}

                          {/* Apply Button */}
                          <Button 
                            className="w-full mt-4" 
                            variant={tier.highlight ? "default" : "outline"}
                            onClick={() => handleApplyClick(tier)}
                          >
                            Apply for {tier.highlight ? "Tier 1" : "Tier 2"}
                          </Button>
                        </div>
                      </motion.div>
                    ))}

                    {/* Close Button */}
                    <Button variant="ghost" className="w-full" onClick={onClose}>
                      Close
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
