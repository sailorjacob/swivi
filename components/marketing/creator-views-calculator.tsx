"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Video, Share2, Calendar, TrendingUp, DollarSign, Info, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

interface CalculatorValues {
  numberOfClippers: number
  postsPerDay: number
  platforms: number
  daysPerWeek: number
  viewsPerPost: number
}

export function CreatorViewsCalculator() {
  const [values, setValues] = useState<CalculatorValues>({
    numberOfClippers: 75,
    postsPerDay: 2,
    platforms: 3,
    daysPerWeek: 5,
    viewsPerPost: 12000
  })

  const [monthlyViews, setMonthlyViews] = useState(0)
  const [annualSavings, setAnnualSavings] = useState(0)
  const [showSavingsPopup, setShowSavingsPopup] = useState(false)

  // Calculate views and savings whenever values change
  useEffect(() => {
    // Calculate total posts per week
    const postsPerWeek = values.numberOfClippers * values.postsPerDay * values.platforms * values.daysPerWeek
    
    // Calculate monthly views (assuming 4.33 weeks per month)
    const monthlyPosts = postsPerWeek * 4.33
    const totalMonthlyViews = monthlyPosts * values.viewsPerPost
    
    // Calculate annual views
    const annualViews = totalMonthlyViews * 12
    
    // Calculate savings vs traditional paid ads
    // Assuming $5 CPM (cost per thousand views) for traditional ads vs $1 CPM for clipper marketing
    const traditionalCPM = 5
    const clipperCPM = 1
    const annualAdCost = (annualViews / 1000) * traditionalCPM
    const clipperCost = (annualViews / 1000) * clipperCPM
    const savings = annualAdCost - clipperCost
    
    setMonthlyViews(Math.round(totalMonthlyViews))
    setAnnualSavings(Math.round(savings))
  }, [values])

  const handleSliderChange = (field: keyof CalculatorValues, value: number[]) => {
    setValues(prev => ({ ...prev, [field]: value[0] }))
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B'
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K'
    }
    return num.toLocaleString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <section className="py-20 md:py-32">
      <div className="max-width-wrapper section-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light mb-4">
              Creator Views Calculator
            </h2>
            <p className="text-lg text-muted-foreground">
              See the massive reach and savings potential of clipper marketing
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-normal">Adjust Your Campaign Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Number of Clippers */}
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Number of Clippers</label>
                  <span className="text-2xl font-light">{values.numberOfClippers}</span>
                </div>
                <Slider
                  value={[values.numberOfClippers]}
                  onValueChange={(value: number[]) => handleSliderChange('numberOfClippers', value)}
                  min={1}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Posts per Day */}
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Posts per Day (per platform)</label>
                  <span className="text-2xl font-light">{values.postsPerDay}</span>
                </div>
                <Slider
                  value={[values.postsPerDay]}
                  onValueChange={(value: number[]) => handleSliderChange('postsPerDay', value)}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Number of Platforms */}
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Social Media Platforms</label>
                  <span className="text-2xl font-light">{values.platforms}</span>
                </div>
                <Slider
                  value={[values.platforms]}
                  onValueChange={(value: number[]) => handleSliderChange('platforms', value)}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Days per Week */}
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Days per Week</label>
                  <span className="text-2xl font-light">{values.daysPerWeek}</span>
                </div>
                <Slider
                  value={[values.daysPerWeek]}
                  onValueChange={(value: number[]) => handleSliderChange('daysPerWeek', value)}
                  min={1}
                  max={7}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Views per Post */}
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Average Views per Post</label>
                  <span className="text-2xl font-light">{formatNumber(values.viewsPerPost)}</span>
                </div>
                <Slider
                  value={[values.viewsPerPost]}
                  onValueChange={(value: number[]) => handleSliderChange('viewsPerPost', value)}
                  min={400}
                  max={35000}
                  step={100}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Results Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Card className="border-primary">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Monthly Views</span>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-2xl font-light text-primary">{formatNumber(monthlyViews)} 🎬</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatNumber(Math.round(monthlyViews / 30))} views per day
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Card 
                className="cursor-pointer relative"
                onClick={() => setShowSavingsPopup(true)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Annual Ad Savings</span>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-2xl font-light">{formatCurrency(annualSavings)} 💸</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    vs. traditional paid ads
                  </p>
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    Click to see breakdown
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Posts/Week</span>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-light">
                  {formatNumber(values.numberOfClippers * values.postsPerDay * values.platforms * values.daysPerWeek)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Annual Views</span>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-light">
                  {formatNumber(Math.round(monthlyViews * 12))}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Monthly Savings</span>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-light">
                  {formatCurrency(Math.round(annualSavings / 12))}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">CPM Saved</span>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-light">${5 - 1}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  per 1K views
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Info Box */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-normal flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Why Clipper Marketing Wins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Traditional Paid Ads</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• $5 CPM costs</li>
                      <li>• Low engagement rates</li>
                      <li>• Ad fatigue issues</li>
                      <li>• Limited authenticity</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Clipper Marketing</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• $1 CPM costs</li>
                      <li>• 3x higher engagement</li>
                      <li>• Authentic content</li>
                      <li>• Scalable reach</li>
                    </ul>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground pt-2 border-t">
                  Based on {formatNumber(monthlyViews)} monthly views, you're saving {formatCurrency(annualSavings)} annually compared to traditional advertising.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Savings Popup */}
      {showSavingsPopup && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSavingsPopup(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-light mb-2">Your Content + Our Clipper Network</h3>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(annualSavings)} Saved Annually</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSavingsPopup(false)}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-6">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  See how our army of expert Clippers delivers authentic reach at just $1 CPM—saving you up to 80% compared to traditional paid ads at $5 CPM. Real people amplifying your content means better engagement, higher conversion, and millions in reclaimed ad budget.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-muted-foreground">Traditional Paid Ads</h4>
                    <Card className="border-2">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">CPM Rate:</span>
                            <span className="font-semibold">$5.00</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Annual Views:</span>
                            <span className="font-medium">{formatNumber(monthlyViews * 12)}</span>
                          </div>
                          <div className="flex justify-between items-center border-t pt-3">
                            <span className="font-medium">Annual Cost:</span>
                            <span className="font-bold text-lg">{formatCurrency(Math.round((monthlyViews * 12 / 1000) * 5))}</span>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t">
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></div>
                              Low engagement rates (1-2%)
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></div>
                              Ad fatigue and banner blindness
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></div>
                              Limited authenticity
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></div>
                              High cost per acquisition
                            </li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-primary">Clipper Marketing</h4>
                    <Card className="border-2 border-primary/20 bg-primary/5">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">CPM Rate:</span>
                            <span className="font-semibold text-primary">$1.00</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Annual Views:</span>
                            <span className="font-medium">{formatNumber(monthlyViews * 12)}</span>
                          </div>
                          <div className="flex justify-between items-center border-t pt-3">
                            <span className="font-medium">Annual Cost:</span>
                            <span className="font-bold text-lg text-primary">{formatCurrency(Math.round((monthlyViews * 12 / 1000) * 1))}</span>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t">
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                              3x higher engagement (5-8%)
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                              Authentic, user-generated content
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                              Scalable reach across platforms
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                              Lower cost per acquisition
                            </li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <h5 className="text-xl font-medium mb-3">Total Annual Savings</h5>
                      <p className="text-4xl font-bold text-primary mb-3">{formatCurrency(annualSavings)}</p>
                      <p className="text-muted-foreground">
                        That's a <span className="font-semibold text-primary">80% reduction</span> in your advertising costs while reaching the same audience with higher engagement rates.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="text-center pt-4">
                  <Button 
                    onClick={() => setShowSavingsPopup(false)}
                    className="px-8 py-3 text-lg"
                    size="lg"
                  >
                    Start Saving Today
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  )
} 