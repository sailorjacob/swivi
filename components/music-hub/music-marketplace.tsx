"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Music, DollarSign, TrendingUp, Play, Pause, Check, Filter, Search, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"

interface MusicCampaign {
  id: string
  artistName: string
  songTitle: string
  genre: string
  mood: string
  audioUrl: string
  coverArt: string
  pricePerThousandViews: number
  totalBudget: number
  budgetSpent: number
  viewsDelivered: number
  targetViews: number
  isActive: boolean
  createdAt: Date
  tags: string[]
}

// Mock data - in production, this would come from a database
const mockCampaigns: MusicCampaign[] = [
  {
    id: "1",
    artistName: "Luna Wave",
    songTitle: "Midnight Dreams",
    genre: "Electronic",
    mood: "Energetic",
    audioUrl: "/audio/midnight-dreams.mp3",
    coverArt: "/covers/luna-wave.jpg",
    pricePerThousandViews: 1.5,
    totalBudget: 500,
    budgetSpent: 125,
    viewsDelivered: 83333,
    targetViews: 333333,
    isActive: true,
    createdAt: new Date("2024-01-15"),
    tags: ["upbeat", "viral", "trending"]
  },
  {
    id: "2",
    artistName: "The Velvet Keys",
    songTitle: "Golden Hour",
    genre: "Indie Pop",
    mood: "Chill",
    audioUrl: "/audio/golden-hour.mp3",
    coverArt: "/covers/velvet-keys.jpg",
    pricePerThousandViews: 2.0,
    totalBudget: 1000,
    budgetSpent: 400,
    viewsDelivered: 200000,
    targetViews: 500000,
    isActive: true,
    createdAt: new Date("2024-01-10"),
    tags: ["relaxing", "aesthetic", "lifestyle"]
  },
  {
    id: "3",
    artistName: "Bass Drop Collective",
    songTitle: "Neon Nights",
    genre: "Hip Hop",
    mood: "Hype",
    audioUrl: "/audio/neon-nights.mp3",
    coverArt: "/covers/bass-drop.jpg",
    pricePerThousandViews: 1.0,
    totalBudget: 300,
    budgetSpent: 300,
    viewsDelivered: 300000,
    targetViews: 300000,
    isActive: false,
    createdAt: new Date("2024-01-05"),
    tags: ["bass", "party", "club"]
  }
]

export function MusicMarketplace() {
  const [campaigns, setCampaigns] = useState<MusicCampaign[]>(mockCampaigns)
  const [selectedCampaign, setSelectedCampaign] = useState<MusicCampaign | null>(null)
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [priceRange, setPriceRange] = useState([0, 5])

  const genres = ["All", "Electronic", "Indie Pop", "Hip Hop", "Rock", "R&B", "Country"]

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.songTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.artistName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGenre = !selectedGenre || selectedGenre === "All" || campaign.genre === selectedGenre
    const matchesPrice = campaign.pricePerThousandViews >= priceRange[0] && 
                        campaign.pricePerThousandViews <= priceRange[1]
    
    return matchesSearch && matchesGenre && matchesPrice && campaign.isActive
  })

  const handlePlayPause = (campaignId: string) => {
    if (isPlaying === campaignId) {
      setIsPlaying(null)
    } else {
      setIsPlaying(campaignId)
    }
  }

  const handleSelectSong = (campaign: MusicCampaign) => {
    setSelectedCampaign(campaign)
  }

  const calculateEarnings = (views: number, pricePerThousand: number) => {
    return (views / 1000) * pricePerThousand
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
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Music className="h-8 w-8 text-primary" />
              <h2 className="text-3xl md:text-4xl font-light">Music Clipping Hub</h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Earn extra income by using sponsored music in your videos. Get paid ${priceRange[0]}-${priceRange[1]} per 1,000 views!
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Campaigns</p>
                    <p className="text-2xl font-light">{campaigns.filter(c => c.isActive).length}</p>
                  </div>
                  <Zap className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Payout</p>
                    <p className="text-2xl font-light">$1.50/1K</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                    <p className="text-2xl font-light">$12,450</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Your Bonus Rate</p>
                    <p className="text-2xl font-light text-primary">+25%</p>
                  </div>
                  <Check className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="flex items-center bg-background rounded-md border px-3 py-2 focus-within:ring-2 focus-within:ring-primary transition">
                  <Search className="h-4 w-4 text-muted-foreground mr-2" />
                  <input
                    type="text"
                    placeholder="Search songs or artists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm"
                  />
                </div>

                {/* Genre Filter */}
                <div className="overflow-x-auto">
                  <div className="flex gap-2 min-w-max pb-2">
                    {genres.map((genre) => (
                      <Button
                        key={genre}
                        variant={selectedGenre === genre ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedGenre(genre)}
                        className="whitespace-nowrap flex-shrink-0"
                      >
                        {genre}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Price Range</span>
                    <span>${priceRange[0]} - ${priceRange[1]}/1K views</span>
                  </div>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    min={0}
                    max={5}
                    step={0.5}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredCampaigns.map((campaign) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative aspect-square bg-gradient-to-br from-primary/20 to-primary/10">
                      {/* Play/Pause Button */}
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                        onClick={() => handlePlayPause(campaign.id)}
                      >
                        {isPlaying === campaign.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      
                      {/* Genre Badge */}
                      <Badge className="absolute top-4 left-4">
                        {campaign.genre}
                      </Badge>
                    </div>

                    <CardContent className="p-4">
                      <div className="mb-4">
                        <h3 className="font-medium text-lg">{campaign.songTitle}</h3>
                        <p className="text-sm text-muted-foreground">{campaign.artistName}</p>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {campaign.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Campaign Progress */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Campaign Progress</span>
                          <span>{Math.round((campaign.viewsDelivered / campaign.targetViews) * 100)}%</span>
                        </div>
                        <Progress 
                          value={(campaign.viewsDelivered / campaign.targetViews) * 100} 
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{campaign.viewsDelivered.toLocaleString()} views</span>
                          <span>{campaign.targetViews.toLocaleString()} target</span>
                        </div>
                      </div>

                      {/* Earnings Info */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-2xl font-light">${campaign.pricePerThousandViews}</p>
                          <p className="text-xs text-muted-foreground">per 1K views</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-primary">
                            ${calculateEarnings(10000, campaign.pricePerThousandViews).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">per 10K views</p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button 
                        className="w-full" 
                        onClick={() => handleSelectSong(campaign)}
                      >
                        Use This Song
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Selected Campaign Modal */}
          <AnimatePresence>
            {selectedCampaign && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                onClick={() => setSelectedCampaign(null)}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-background rounded-lg p-6 max-w-md w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-xl font-medium mb-4">Song Selected!</h3>
                  <p className="text-muted-foreground mb-6">
                    You've selected "{selectedCampaign.songTitle}" by {selectedCampaign.artistName}.
                  </p>
                  
                  <div className="bg-muted rounded-lg p-4 mb-6">
                    <h4 className="font-medium mb-2">How to earn:</h4>
                    <ol className="text-sm space-y-2 text-muted-foreground">
                      <li>1. Download the song file</li>
                      <li>2. Use it as background music in your video</li>
                      <li>3. Upload your video and submit the link</li>
                      <li>4. Get paid ${selectedCampaign.pricePerThousandViews} per 1,000 views!</li>
                    </ol>
                  </div>

                  <div className="flex gap-3">
                    <Button className="flex-1">
                      Download Song
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedCampaign(null)}>
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
} 