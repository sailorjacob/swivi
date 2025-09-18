"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Search,
  Filter,
  Target,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  MapPin,
  Calendar,
  Play,
  ExternalLink,
  Eye
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import toast from "react-hot-toast"
import { ClipSubmissionModal } from "@/components/clippers/clip-submission-modal"

// Mock data for campaigns
const campaigns = [
  {
    id: "1",
    title: "Summer Vibes Collection",
    creator: "Lifestyle Guru",
    description: "Create engaging summer-themed content clips for our lifestyle brand. Focus on beach vibes, outdoor activities, and summer fashion trends.",
    platform: "tiktok",
    countryTier: "Tier 1",
    budget: 2500,
    spent: 1800,
    minPayout: 25,
    maxPayout: 75,
    deadline: "2024-09-20",
    status: "active",
    totalClippers: 23,
    activeClippers: 18,
    requirements: [
      "Min 7 seconds duration",
      "0.5% engagement rate",
      "Summer-themed content",
      "TikTok optimized"
    ],
    assets: [
      { type: "video", url: "https://drive.google.com/file1", name: "Summer Assets Pack" },
      { type: "guide", url: "https://docs.google.com/guide1", name: "Content Guidelines" }
    ]
  },
  {
    id: "2",
    title: "Tech Reviews 2024",
    creator: "Tech Reviewer Pro",
    description: "Review and clip the latest tech gadgets and software. Create engaging content that showcases product features and user experiences.",
    platform: "youtube",
    countryTier: "Tier 1",
    budget: 5000,
    spent: 3200,
    minPayout: 50,
    maxPayout: 150,
    deadline: "2024-09-25",
    status: "active",
    totalClippers: 15,
    activeClippers: 12,
    requirements: [
      "Min 7 seconds duration",
      "0.5% engagement rate",
      "Product-focused content",
      "YouTube Shorts format"
    ],
    assets: [
      { type: "video", url: "https://drive.google.com/file2", name: "Tech Demo Videos" },
      { type: "guide", url: "https://docs.google.com/guide2", name: "Review Guidelines" }
    ]
  },
  {
    id: "3",
    title: "Fitness Motivation",
    creator: "Fit Coach Max",
    description: "Create motivational fitness content clips to inspire our audience. Focus on workout tips, healthy lifestyle, and fitness journeys.",
    platform: "instagram",
    countryTier: "Tier 1",
    budget: 1800,
    spent: 1200,
    minPayout: 30,
    maxPayout: 90,
    deadline: "2024-09-18",
    status: "active",
    totalClippers: 28,
    activeClippers: 22,
    requirements: [
      "Min 7 seconds duration",
      "0.5% engagement rate",
      "Motivational content",
      "Instagram Reels format"
    ],
    assets: [
      { type: "video", url: "https://drive.google.com/file3", name: "Fitness Content Pack" },
      { type: "guide", url: "https://docs.google.com/guide3", name: "Motivation Guidelines" }
    ]
  },
  {
    id: "4",
    title: "Comedy Skits",
    creator: "Comedy Central",
    description: "Create funny, engaging comedy content clips. Perfect for clippers who love making people laugh with creative skits and jokes.",
    platform: "tiktok",
    countryTier: "Tier 2",
    budget: 3200,
    spent: 2800,
    minPayout: 20,
    maxPayout: 60,
    deadline: "2024-09-22",
    status: "active",
    totalClippers: 31,
    activeClippers: 25,
    requirements: [
      "Min 7 seconds duration",
      "0.5% engagement rate",
      "Comedy content",
      "Family-friendly"
    ],
    assets: [
      { type: "video", url: "https://drive.google.com/file4", name: "Comedy Assets" },
      { type: "guide", url: "https://docs.google.com/guide4", name: "Comedy Guidelines" }
    ]
  }
]

function CampaignCard({ campaign, onSubmitClip }: { campaign: typeof campaigns[0]; onSubmitClip: (campaign: typeof campaigns[0]) => void }) {
  const progress = (campaign.spent / campaign.budget) * 100
  const timeLeft = Math.ceil((new Date(campaign.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  const handleJoinCampaign = () => {
    toast.success(`Joined ${campaign.title}!`)
    // TODO: Add join campaign logic
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-card border-gray-800 hover:border-border transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-white text-lg mb-2">{campaign.title}</CardTitle>
              <p className="text-muted-foreground text-sm mb-3">{campaign.creator}</p>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <Target className="w-4 h-4 mr-1" />
                  {campaign.platform}
                </span>
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {campaign.countryTier}
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {timeLeft} days left
                </span>
              </div>
            </div>
            <Badge variant="outline" className="text-foreground border-muted-foreground">
              Active
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {campaign.description}
          </p>

          {/* Budget Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Budget Progress</span>
              <span className="text-white">${campaign.spent}/${campaign.budget}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Payout Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center text-foreground">
              <DollarSign className="w-4 h-4 mr-1" />
              <span className="font-medium">${campaign.minPayout}-${campaign.maxPayout}</span>
            </div>
            <div className="flex items-center text-muted-foreground text-sm">
              <Users className="w-4 h-4 mr-1" />
              {campaign.activeClippers}/{campaign.totalClippers} active
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-2">
            <h4 className="text-white text-sm font-medium">Requirements:</h4>
            <div className="flex flex-wrap gap-2">
              {campaign.requirements.slice(0, 3).map((req, index) => (
                <Badge key={index} variant="outline" className="text-xs text-muted-foreground">
                  {req}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <Link href={`/clippers/campaigns/${campaign.id}`}>
              <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:bg-muted">
                View Details
              </Button>
            </Link>
            <Button
              size="sm"
              className="bg-foreground hover:bg-foreground/90 flex-1"
              onClick={() => onSubmitClip(campaign)}
            >
              Submit Clip
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function CampaignDetailView({ campaign, onSubmitClip }: { campaign: typeof campaigns[0]; onSubmitClip: (campaign: typeof campaigns[0]) => void }) {
  const progress = (campaign.spent / campaign.budget) * 100
  const timeLeft = Math.ceil((new Date(campaign.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-light text-white mb-2">{campaign.title}</h1>
          <p className="text-muted-foreground mb-4">by {campaign.creator}</p>
          <div className="flex items-center space-x-4 text-sm">
            <Badge variant="outline" className="text-foreground border-muted-foreground">
              Active Campaign
            </Badge>
            <span className="text-muted-foreground flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {timeLeft} days remaining
            </span>
          </div>
        </div>
        <Button 
          className="bg-foreground hover:bg-foreground/90"
          onClick={() => onSubmitClip(campaign)}
        >
          Submit Clip
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-background border-b border-border rounded-none h-auto p-0">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent bg-transparent text-muted-foreground data-[state=active]:text-foreground px-4 py-3 font-medium transition-all ">
            Overview
          </TabsTrigger>
          <TabsTrigger value="assets" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent bg-transparent text-muted-foreground data-[state=active]:text-foreground px-4 py-3 font-medium transition-all ">
            Assets & Content
          </TabsTrigger>
          <TabsTrigger value="updates" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent bg-transparent text-muted-foreground data-[state=active]:text-foreground px-4 py-3 font-medium transition-all ">
            Updates
          </TabsTrigger>
          <TabsTrigger value="chat" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent bg-transparent text-muted-foreground data-[state=active]:text-foreground px-4 py-3 font-medium transition-all ">
            Chat
          </TabsTrigger>
          <TabsTrigger value="submit" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent bg-transparent text-muted-foreground data-[state=active]:text-foreground px-4 py-3 font-medium transition-all ">
            Submit Clip
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Campaign Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{campaign.description}</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {campaign.requirements.map((req, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-muted-foreground">{req}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="bg-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Campaign Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Budget</span>
                    <span className="text-white font-medium">${campaign.budget}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Spent</span>
                    <span className="text-white font-medium">${campaign.spent}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="text-white font-medium">${campaign.budget - campaign.spent}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Payout Range</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground mb-2">
                      ${campaign.minPayout} - ${campaign.maxPayout}
                    </div>
                    <p className="text-muted-foreground text-sm">per approved clip</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Active Clippers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">
                      {campaign.activeClippers}/{campaign.totalClippers}
                    </div>
                    <p className="text-muted-foreground text-sm">participants</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <Card className="bg-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Campaign Assets</CardTitle>
              <p className="text-muted-foreground text-sm">
                Access these resources to create high-quality clips for this campaign.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaign.assets.map((asset, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        {asset.type === 'video' ? (
                          <Play className="w-5 h-5 text-white" />
                        ) : (
                          <ExternalLink className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{asset.name}</p>
                        <p className="text-muted-foreground text-sm capitalize">{asset.type}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:bg-muted">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Open
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="updates">
          <Card className="bg-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Campaign Updates</CardTitle>
              <p className="text-muted-foreground text-sm">
                Stay updated with the latest news and top-performing clips.
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">No updates yet. Check back later!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat">
          <Card className="bg-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Campaign Chat</CardTitle>
              <p className="text-muted-foreground text-sm">
                Discuss strategies and get help from other clippers.
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Chat functionality coming soon!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submit">
          <Card className="bg-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Submit Your Clip</CardTitle>
              <p className="text-muted-foreground text-sm">
                Ready to submit? Make sure your clip meets all requirements.
              </p>
            </CardHeader>
            <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Ready to submit your clip?</p>
                  <Button 
                    className="mt-4 bg-foreground hover:bg-foreground/90"
                    onClick={() => onSubmitClip(campaign)}
                  >
                    Submit Clip
                  </Button>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function CampaignsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCampaign, setSelectedCampaign] = useState<typeof campaigns[0] | null>(null)
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false)
  const [selectedCampaignForSubmission, setSelectedCampaignForSubmission] = useState<typeof campaigns[0] | null>(null)

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmitClip = (campaign: typeof campaigns[0]) => {
    setSelectedCampaignForSubmission(campaign)
    setSubmissionModalOpen(true)
  }

  if (selectedCampaign) {
    return (
      <CampaignDetailView campaign={selectedCampaign} onSubmitClip={handleSubmitClip} />
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-white mb-2">Active Campaigns</h1>
        <p className="text-muted-foreground">Browse and join campaigns to start earning.</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-muted border-border text-white"
          />
        </div>
        <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Campaign Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCampaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} onSubmitClip={handleSubmitClip} />
        ))}
      </div>

      {/* Submission Modal */}
      <ClipSubmissionModal
        open={submissionModalOpen}
        onOpenChange={setSubmissionModalOpen}
        campaign={selectedCampaignForSubmission ? {
          id: selectedCampaignForSubmission.id,
          title: selectedCampaignForSubmission.title,
          creator: selectedCampaignForSubmission.creator,
          payout: `$${selectedCampaignForSubmission.minPayout}-${selectedCampaignForSubmission.maxPayout} per clip`
        } : undefined}
      />

      {filteredCampaigns.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No campaigns found</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria.</p>
        </div>
      )}
    </div>
  )
}
