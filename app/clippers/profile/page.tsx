"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion } from "framer-motion"
import {
  User,
  Upload,
  Link as LinkIcon,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Eye,
  Play,
  Plus,
  Trash2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import toast from "react-hot-toast"

// Form validation schemas
const profileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  bio: z.string().max(500, "Bio must be less than 500 characters"),
  paypalEmail: z.string().email("Please enter a valid email address"),
})

const clipSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  platform: z.enum(["tiktok", "youtube", "instagram", "twitter"]),
  campaignId: z.string().min(1, "Please select a campaign"),
})

const socialSchema = z.object({
  platform: z.enum(["tiktok", "youtube", "instagram", "twitter"]),
  handle: z.string().min(1, "Handle is required"),
})

// Mock data
const submittedClips = [
  {
    id: "1",
    url: "https://tiktok.com/@user/clip1",
    platform: "tiktok",
    campaign: "Dance Challenge 2024",
    status: "approved",
    views: 15420,
    earnings: 85,
    submittedAt: "2024-09-15T10:30:00Z"
  },
  {
    id: "2",
    url: "https://youtube.com/watch?v=abc123",
    platform: "youtube",
    campaign: "Tech Reviews 2024",
    status: "pending",
    views: 0,
    earnings: 0,
    submittedAt: "2024-09-14T15:45:00Z"
  },
  {
    id: "3",
    url: "https://instagram.com/p/def456",
    platform: "instagram",
    campaign: "Summer Vibes",
    status: "rejected",
    views: 3200,
    earnings: 0,
    submittedAt: "2024-09-13T09:15:00Z"
  }
]

const socialAccounts = [
  { platform: "tiktok", handle: "@clipper_pro", verified: true },
  { platform: "instagram", handle: "@clipper_pro", verified: true },
  { platform: "youtube", handle: "ClipperPro", verified: false },
  { platform: "twitter", handle: "@clipper_pro", verified: true },
]

const activeCampaigns = [
  { id: "1", name: "Dance Challenge 2024", payout: "$25-75" },
  { id: "2", name: "Tech Reviews 2024", payout: "$50-150" },
  { id: "3", name: "Summer Vibes Collection", payout: "$30-90" },
]

function ProfileForm() {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "Clipper Pro",
      bio: "Professional content clipper with 2+ years experience creating viral content.",
      paypalEmail: "clipper@example.com",
    },
  })

  const onSubmit = async (data: any) => {
    setIsLoading(true)
    // TODO: Save profile data to Supabase
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success("Profile updated successfully!")
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src="" />
          <AvatarFallback className="bg-green-600 text-white text-xl">
            CP
          </AvatarFallback>
        </Avatar>
        <Button type="button" variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
          <Upload className="w-4 h-4 mr-2" />
          Change Avatar
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="displayName" className="text-white">Display Name</Label>
          <Input
            id="displayName"
            {...register("displayName")}
            className="bg-gray-800 border-gray-700 text-white"
          />
          {errors.displayName && (
            <p className="text-red-400 text-sm mt-1">{errors.displayName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="bio" className="text-white">Bio</Label>
          <Textarea
            id="bio"
            {...register("bio")}
            className="bg-gray-800 border-gray-700 text-white"
            rows={3}
          />
          {errors.bio && (
            <p className="text-red-400 text-sm mt-1">{errors.bio.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="paypalEmail" className="text-white">PayPal Email</Label>
          <Input
            id="paypalEmail"
            type="email"
            {...register("paypalEmail")}
            className="bg-gray-800 border-gray-700 text-white"
          />
          {errors.paypalEmail && (
            <p className="text-red-400 text-sm mt-1">{errors.paypalEmail.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
        {isLoading ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  )
}

function SubmitClipForm() {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(clipSchema),
  })

  const onSubmit = async (data: any) => {
    setIsLoading(true)
    // TODO: Submit clip to Supabase
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success("Clip submitted successfully!")
    reset()
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="url" className="text-white">Clip URL</Label>
        <Input
          id="url"
          placeholder="https://tiktok.com/@user/clip"
          {...register("url")}
          className="bg-gray-800 border-gray-700 text-white"
        />
        {errors.url && (
          <p className="text-red-400 text-sm mt-1">{errors.url.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="platform" className="text-white">Platform</Label>
        <select
          {...register("platform")}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2"
        >
          <option value="">Select platform</option>
          <option value="tiktok">TikTok</option>
          <option value="youtube">YouTube Shorts</option>
          <option value="instagram">Instagram Reels</option>
          <option value="twitter">X (Twitter)</option>
        </select>
        {errors.platform && (
          <p className="text-red-400 text-sm mt-1">{errors.platform.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="campaignId" className="text-white">Campaign</Label>
        <select
          {...register("campaignId")}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2"
        >
          <option value="">Select campaign</option>
          {activeCampaigns.map(campaign => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name} - {campaign.payout}
            </option>
          ))}
        </select>
        {errors.campaignId && (
          <p className="text-red-400 text-sm mt-1">{errors.campaignId.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700">
        {isLoading ? "Submitting..." : "Submit Clip"}
      </Button>
    </form>
  )
}

function SocialAccountsForm() {
  const [accounts, setAccounts] = useState(socialAccounts)
  const [isAdding, setIsAdding] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(socialSchema),
  })

  const onSubmit = async (data: any) => {
    // TODO: Add social account to Supabase
    const newAccount = { ...data, verified: false }
    setAccounts([...accounts, newAccount])
    setIsAdding(false)
    reset()
    toast.success("Social account added!")
  }

  const removeAccount = (index: number) => {
    setAccounts(accounts.filter((_, i) => i !== index))
    toast.success("Social account removed!")
  }

  return (
    <div className="space-y-6">
      {/* Existing Accounts */}
      <div className="space-y-4">
        {accounts.map((account, index) => (
          <Card key={index} className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white capitalize">
                      {account.platform[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium capitalize">{account.platform}</p>
                    <p className="text-neutral-400 text-sm">{account.handle}</p>
                  </div>
                  {account.verified ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-400" />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAccount(index)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Account */}
      {!isAdding ? (
        <Button
          onClick={() => setIsAdding(true)}
          variant="outline"
          className="border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Social Account
        </Button>
      ) : (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label className="text-white">Platform</Label>
                <select
                  {...register("platform")}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2"
                >
                  <option value="">Select platform</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="instagram">Instagram</option>
                  <option value="twitter">X (Twitter)</option>
                </select>
                {errors.platform && (
                  <p className="text-red-400 text-sm mt-1">{errors.platform.message}</p>
                )}
              </div>

              <div>
                <Label className="text-white">Handle/Username</Label>
                <Input
                  {...register("handle")}
                  placeholder="@username"
                  className="bg-gray-800 border-gray-700 text-white"
                />
                {errors.handle && (
                  <p className="text-red-400 text-sm mt-1">{errors.handle.message}</p>
                )}
              </div>

              <div className="flex space-x-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Add Account
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false)
                    reset()
                  }}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SubmittedClipsList() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-400/10'
      case 'pending': return 'text-yellow-400 bg-yellow-400/10'
      case 'rejected': return 'text-red-400 bg-red-400/10'
      default: return 'text-neutral-400 bg-gray-400/10'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return CheckCircle
      case 'pending': return Clock
      case 'rejected': return XCircle
      default: return Clock
    }
  }

  return (
    <div className="space-y-4">
      {submittedClips.map((clip) => {
        const StatusIcon = getStatusIcon(clip.status)
        return (
          <Card key={clip.id} className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <StatusIcon className={`w-4 h-4 ${getStatusColor(clip.status).split(' ')[0]}`} />
                  <Badge variant="outline" className={getStatusColor(clip.status)}>
                    {clip.status}
                  </Badge>
                  <Badge variant="outline" className="text-neutral-400">
                    {clip.platform}
                  </Badge>
                </div>
                <span className="text-neutral-400 text-sm">
                  {new Date(clip.submittedAt).toLocaleDateString()}
                </span>
              </div>

              <h4 className="text-white font-medium mb-1">{clip.campaign}</h4>
              <p className="text-neutral-400 text-sm mb-3 truncate">{clip.url}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-neutral-400 flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {clip.views.toLocaleString()}
                  </span>
                  {clip.earnings > 0 && (
                    <span className="text-green-400 flex items-center font-medium">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {clip.earnings}
                    </span>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-light text-white mb-2">Profile</h1>
        <p className="text-neutral-400">Manage your account and track your submissions.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800 border border-gray-700">
          <TabsTrigger value="profile" className="text-gray-300 data-[state=active]:text-white">
            Profile
          </TabsTrigger>
          <TabsTrigger value="submit" className="text-gray-300 data-[state=active]:text-white">
            Submit Clip
          </TabsTrigger>
          <TabsTrigger value="social" className="text-gray-300 data-[state=active]:text-white">
            Social Accounts
          </TabsTrigger>
          <TabsTrigger value="clips" className="text-gray-300 data-[state=active]:text-white">
            My Clips
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submit">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Submit New Clip</CardTitle>
            </CardHeader>
            <CardContent>
              <SubmitClipForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Social Media Accounts</CardTitle>
              <p className="text-neutral-400 text-sm">
                Connect your social accounts to submit clips and track performance.
              </p>
            </CardHeader>
            <CardContent>
              <SocialAccountsForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clips">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">Submitted Clips</CardTitle>
              <p className="text-neutral-400 text-sm">
                Track the status and performance of your submitted clips.
              </p>
            </CardHeader>
            <CardContent>
              <SubmittedClipsList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
