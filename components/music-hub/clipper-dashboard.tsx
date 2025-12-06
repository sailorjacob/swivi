"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Music, DollarSign, Link, CheckCircle, Clock, TrendingUp, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface VideoSubmission {
  id: string
  campaignId: string
  campaignName: string
  artistName: string
  videoUrl: string
  platform: string
  viewCount: number
  earnings: number
  status: "pending" | "verified" | "rejected"
  submittedAt: Date
}

const mockSubmissions: VideoSubmission[] = [
  {
    id: "1",
    campaignId: "1",
    campaignName: "Midnight Dreams",
    artistName: "Luna Wave",
    videoUrl: "https://tiktok.com/@user/video/123",
    platform: "TikTok",
    viewCount: 45000,
    earnings: 67.50,
    status: "verified",
    submittedAt: new Date("2024-01-20")
  },
  {
    id: "2",
    campaignId: "2",
    campaignName: "Golden Hour",
    artistName: "The Velvet Keys",
    videoUrl: "https://instagram.com/reel/456",
    platform: "Instagram",
    viewCount: 12000,
    earnings: 24.00,
    status: "pending",
    submittedAt: new Date("2024-01-22")
  }
]

export function CreatorDashboard() {
  const [submissions, setSubmissions] = useState<VideoSubmission[]>(mockSubmissions)
  const [newVideoUrl, setNewVideoUrl] = useState("")
  const [selectedCampaignId, setSelectedCampaignId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalEarnings = submissions
    .filter(s => s.status === "verified")
    .reduce((sum, s) => sum + s.earnings, 0)

  const totalViews = submissions
    .filter(s => s.status === "verified")
    .reduce((sum, s) => sum + s.viewCount, 0)

  const pendingEarnings = submissions
    .filter(s => s.status === "pending")
    .reduce((sum, s) => sum + s.earnings, 0)

  const handleSubmitVideo = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Add new submission
    const newSubmission: VideoSubmission = {
      id: Date.now().toString(),
      campaignId: selectedCampaignId,
      campaignName: "New Campaign", // Would come from selected campaign
      artistName: "Artist Name", // Would come from selected campaign
      videoUrl: newVideoUrl,
      platform: detectPlatform(newVideoUrl),
      viewCount: 0,
      earnings: 0,
      status: "pending",
      submittedAt: new Date()
    }
    
    setSubmissions([newSubmission, ...submissions])
    setNewVideoUrl("")
    setIsSubmitting(false)
  }

  const detectPlatform = (url: string): string => {
    if (url.includes("tiktok")) return "TikTok"
    if (url.includes("instagram")) return "Instagram"
    if (url.includes("youtube")) return "YouTube"
    return "Other"
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "TikTok": return "bg-pink-500"
      case "Instagram": return "bg-purple-500"
      case "YouTube": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  return (
    <section className="py-20 md:py-32">
      <div className="max-width-wrapper section-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-light mb-4">
              Music Campaign Dashboard
            </h2>
            <p className="text-lg text-muted-foreground">
              Track your earnings and submit videos using sponsored music
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                    <p className="text-2xl font-light">${totalEarnings.toFixed(2)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-light">${pendingEarnings.toFixed(2)}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Views</p>
                    <p className="text-2xl font-light">{totalViews.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Videos</p>
                    <p className="text-2xl font-light">{submissions.length}</p>
                  </div>
                  <Music className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="submit" className="space-y-4">
            <TabsList>
              <TabsTrigger value="submit">Submit Video</TabsTrigger>
              <TabsTrigger value="history">Submission History</TabsTrigger>
            </TabsList>

            {/* Submit Video Tab */}
            <TabsContent value="submit">
              <Card>
                <CardHeader>
                  <CardTitle>Submit a Video with Sponsored Music</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitVideo} className="space-y-4">
                    <Alert>
                      <Upload className="h-4 w-4" />
                      <AlertDescription>
                        Make sure you've used the sponsored music in your video before submitting.
                        We'll verify the audio and view count within 24 hours.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label htmlFor="campaign">Select Campaign</Label>
                      <select
                        id="campaign"
                        value={selectedCampaignId}
                        onChange={(e) => setSelectedCampaignId(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        required
                      >
                        <option value="">Choose a campaign...</option>
                        <option value="1">Midnight Dreams - Luna Wave ($1.50/1K)</option>
                        <option value="2">Golden Hour - The Velvet Keys ($2.00/1K)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="videoUrl">Video URL</Label>
                      <Input
                        id="videoUrl"
                        type="url"
                        value={newVideoUrl}
                        onChange={(e) => setNewVideoUrl(e.target.value)}
                        placeholder="https://tiktok.com/@yourhandle/video/..."
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Supported: TikTok, Instagram Reels, YouTube Shorts
                      </p>
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Link className="h-4 w-4 mr-2" />
                          Submit Video
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Your Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div
                        key={submission.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-12 rounded-full ${getPlatformColor(submission.platform)}`} />
                          <div>
                            <h4 className="font-medium">{submission.campaignName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {submission.artistName} • {submission.platform}
                            </p>
                            <a
                              href={submission.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              View Video →
                            </a>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            {submission.status === "verified" && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            {submission.status === "pending" && (
                              <Clock className="h-4 w-4 text-yellow-500" />
                            )}
                            <Badge
                              variant={
                                submission.status === "verified"
                                  ? "default"
                                  : submission.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {submission.status}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">
                            ${submission.earnings.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {submission.viewCount.toLocaleString()} views
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Tips */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Pro Tips for Maximum Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Use the music prominently in your video for better verification</li>
                <li>• Post during peak hours for maximum views</li>
                <li>• Create content that matches the song's mood and genre</li>
                <li>• Submit your video link within 48 hours of posting</li>
                <li>• Higher view counts = higher earnings!</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
} 