"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Upload, Music, DollarSign, Target, Zap, Info, TrendingUp, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CampaignFormData {
  artistName: string
  songTitle: string
  genre: string
  mood: string
  description: string
  tags: string[]
  pricePerThousandViews: number
  totalBudget: number
  audioFile: File | null
  coverArt: File | null
}

export function ArtistSubmission() {
  const [formData, setFormData] = useState<CampaignFormData>({
    artistName: "",
    songTitle: "",
    genre: "",
    mood: "",
    description: "",
    tags: [],
    pricePerThousandViews: 1.0,
    totalBudget: 100,
    audioFile: null,
    coverArt: null
  })

  const [currentTag, setCurrentTag] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const genres = ["Electronic", "Indie Pop", "Hip Hop", "Rock", "R&B", "Country", "Pop", "Alternative"]
  const moods = ["Energetic", "Chill", "Hype", "Emotional", "Upbeat", "Dark", "Happy", "Motivational"]

  const calculateTargetViews = () => {
    return Math.floor((formData.totalBudget / formData.pricePerThousandViews) * 1000)
  }

  const handleAddTag = () => {
    if (currentTag && formData.tags.length < 5) {
      setFormData({ ...formData, tags: [...formData.tags, currentTag] })
      setCurrentTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({ 
      ...formData, 
      tags: formData.tags.filter(tag => tag !== tagToRemove) 
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    // Show success message
  }

  return (
    <section className="py-20 md:py-32 bg-muted/30">
      <div className="max-width-wrapper section-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Upload className="h-8 w-8 text-primary" />
              <h2 className="text-3xl md:text-4xl font-light">Submit Your Music</h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get your music in front of thousands of content creators. Pay only for real views!
            </p>
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-medium mb-2">Go Viral</h3>
                <p className="text-sm text-muted-foreground">
                  Get your music used by top creators across all platforms
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-medium mb-2">Real Engagement</h3>
                <p className="text-sm text-muted-foreground">
                  Connect with audiences through authentic content
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <DollarSign className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-medium mb-2">Pay Per View</h3>
                <p className="text-sm text-muted-foreground">
                  Only pay for verified views, starting at $1 per 1K
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Submission Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create Your Campaign</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="artistName">Artist Name</Label>
                    <Input
                      id="artistName"
                      value={formData.artistName}
                      onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                      placeholder="Your artist name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="songTitle">Song Title</Label>
                    <Input
                      id="songTitle"
                      value={formData.songTitle}
                      onChange={(e) => setFormData({ ...formData, songTitle: e.target.value })}
                      placeholder="Your song title"
                      required
                    />
                  </div>
                </div>

                {/* Genre and Mood */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="genre">Genre</Label>
                    <Select
                      value={formData.genre}
                      onValueChange={(value: string) => setFormData({ ...formData, genre: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        {genres.map((genre) => (
                          <SelectItem key={genre} value={genre}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mood">Mood</Label>
                    <Select
                      value={formData.mood}
                      onValueChange={(value: string) => setFormData({ ...formData, mood: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select mood" />
                      </SelectTrigger>
                      <SelectContent>
                        {moods.map((mood) => (
                          <SelectItem key={mood} value={mood}>
                            {mood}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your song and what type of content it's perfect for..."
                    rows={4}
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags (up to 5)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      placeholder="Add a tag"
                      onKeyPress={(e: React.KeyboardEvent) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                    />
                    <Button type="button" onClick={handleAddTag} variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* File Uploads */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="audioFile">Audio File</Label>
                    <Input
                      id="audioFile"
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setFormData({ ...formData, audioFile: e.target.files?.[0] || null })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coverArt">Cover Art (optional)</Label>
                    <Input
                      id="coverArt"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, coverArt: e.target.files?.[0] || null })}
                    />
                  </div>
                </div>

                {/* Pricing */}
                <Card className="border-primary">
                  <CardContent className="p-6">
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Campaign Pricing
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Price per 1K views */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Price per 1,000 views</Label>
                          <span className="text-2xl font-light">${formData.pricePerThousandViews.toFixed(2)}</span>
                        </div>
                        <Slider
                          value={[formData.pricePerThousandViews]}
                          onValueChange={(value) => setFormData({ ...formData, pricePerThousandViews: value[0] })}
                          min={0.5}
                          max={5}
                          step={0.1}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Higher prices attract premium creators but may take longer to complete
                        </p>
                      </div>

                      {/* Total Budget */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Total Campaign Budget</Label>
                          <span className="text-2xl font-light">${formData.totalBudget}</span>
                        </div>
                        <Slider
                          value={[formData.totalBudget]}
                          onValueChange={(value) => setFormData({ ...formData, totalBudget: value[0] })}
                          min={100}
                          max={5000}
                          step={50}
                          className="w-full"
                        />
                      </div>

                      {/* Campaign Summary */}
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Your campaign will target <strong>{calculateTargetViews().toLocaleString()}</strong> views.
                          You'll pay ${formData.pricePerThousandViews.toFixed(2)} per 1,000 verified views.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Zap className="h-4 w-4 mr-2 animate-spin" />
                      Creating Campaign...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Launch Campaign - ${formData.totalBudget}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-medium">1</span>
                  </div>
                  <h4 className="font-medium mb-1">Submit</h4>
                  <p className="text-sm text-muted-foreground">Upload your song and set your budget</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-medium">2</span>
                  </div>
                  <h4 className="font-medium mb-1">Match</h4>
                  <p className="text-sm text-muted-foreground">Creators discover and use your music</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-medium">3</span>
                  </div>
                  <h4 className="font-medium mb-1">Verify</h4>
                  <p className="text-sm text-muted-foreground">We verify views and track performance</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-medium">4</span>
                  </div>
                  <h4 className="font-medium mb-1">Pay</h4>
                  <p className="text-sm text-muted-foreground">Only pay for verified views</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
} 