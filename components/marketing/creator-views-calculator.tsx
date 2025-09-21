"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Video, Share2, Calendar, TrendingUp, DollarSign, Info, X, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false)

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
                  <span className="text-2xl font-light transition-all duration-200 ease-out">{values.numberOfClippers}</span>
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
                  <span className="text-2xl font-light transition-all duration-200 ease-out">{values.postsPerDay}</span>
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
                  <span className="text-2xl font-light transition-all duration-200 ease-out">{values.platforms}</span>
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
                  <span className="text-2xl font-light transition-all duration-200 ease-out">{values.daysPerWeek}</span>
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
                  <span className="text-2xl font-light transition-all duration-200 ease-out">{formatNumber(values.viewsPerPost)}</span>
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
                  <p className="text-xs text-gray-400 mt-1 font-medium">
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
          className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setShowSavingsPopup(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h3 className="text-xl sm:text-2xl font-light text-foreground mb-3">Your Annual Savings Breakdown</h3>
                  <p className="text-2xl sm:text-3xl font-light text-foreground">{formatCurrency(annualSavings)}</p>
                  <p className="text-sm text-muted-foreground mt-2">vs. traditional advertising</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSavingsPopup(false)}
                  className="shrink-0 hover:bg-muted/50 -mt-2 -mr-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-6">
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Our clipper network delivers authentic reach at just $1 CPM—saving you up to 80% compared to traditional paid ads at $5 CPM.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Traditional Ads</h4>
                    <Card className="border border-border/50 bg-muted/30">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">CPM:</span>
                            <span className="font-light text-sm text-foreground">$5.00</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Annual Cost:</span>
                            <span className="font-light text-sm text-muted-foreground">{formatCurrency(Math.round((monthlyViews * 12 / 1000) * 5))}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Clipper Network</h4>
                    <Card className="border border-border/50 bg-card/50">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">CPM:</span>
                            <span className="font-light text-sm text-foreground">$1.00</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Annual Cost:</span>
                            <span className="font-light text-sm text-foreground">{formatCurrency(Math.round((monthlyViews * 12 / 1000) * 1))}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Card className="bg-card/30 border border-border/50 shadow-sm">
                  <CardContent className="p-5 text-center">
                    <h5 className="text-sm font-medium mb-3 text-foreground">Total Annual Savings</h5>
                    <p className="text-2xl sm:text-3xl font-light mb-3 text-foreground">{formatCurrency(annualSavings)}</p>
                    <p className="text-xs text-muted-foreground">
                      That's an <span className="font-medium text-foreground">80% reduction</span> in ad costs
                    </p>
                  </CardContent>
                </Card>

                <div className="text-center pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/50 text-xs"
                  >
                    {showDetailedBreakdown ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Show more details
                      </>
                    )}
                  </Button>
                </div>

                <AnimatePresence>
                  {showDetailedBreakdown && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-5 overflow-hidden"
                    >
                      <div className="pt-4 border-t border-border/30">
                        <h5 className="text-sm font-medium text-foreground mb-4">Detailed Comparison</h5>

                        <div className="grid grid-cols-1 gap-5">
                          <div className="space-y-3">
                            <h6 className="text-xs font-medium text-muted-foreground">Traditional Paid Ads</h6>
                            <Card className="border border-border/30 bg-muted/20">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">CPM Rate:</span>
                                    <span className="font-light text-xs text-foreground">$5.00</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">Annual Views:</span>
                                    <span className="font-light text-xs text-foreground">{formatNumber(monthlyViews * 12)}</span>
                                  </div>
                                  <div className="flex justify-between items-center border-t border-border/30 pt-3">
                                    <span className="font-light text-xs text-foreground">Annual Cost:</span>
                                    <span className="font-light text-xs text-muted-foreground">{formatCurrency(Math.round((monthlyViews * 12 / 1000) * 5))}</span>
                                  </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-border/30">
                                  <ul className="space-y-2 text-xs text-muted-foreground">
                                    <li className="flex items-center gap-2">
                                      <div className="w-1 h-1 bg-muted-foreground/50 rounded-full"></div>
                                      Low engagement (1-2%)
                                    </li>
                                    <li className="flex items-center gap-2">
                                      <div className="w-1 h-1 bg-muted-foreground/50 rounded-full"></div>
                                      Ad fatigue issues
                                    </li>
                                    <li className="flex items-center gap-2">
                                      <div className="w-1 h-1 bg-muted-foreground/50 rounded-full"></div>
                                      Limited authenticity
                                    </li>
                                    <li className="flex items-center gap-2">
                                      <div className="w-1 h-1 bg-muted-foreground/50 rounded-full"></div>
                                      High acquisition cost
                                    </li>
                                  </ul>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          <div className="space-y-3">
                            <h6 className="text-xs font-medium text-foreground">Clipper Marketing</h6>
                            <Card className="border border-border/30 bg-card/30">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">CPM Rate:</span>
                                    <span className="font-light text-xs text-foreground">$1.00</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">Annual Views:</span>
                                    <span className="font-light text-xs text-foreground">{formatNumber(monthlyViews * 12)}</span>
                                  </div>
                                  <div className="flex justify-between items-center border-t border-border/30 pt-3">
                                    <span className="font-light text-xs text-foreground">Annual Cost:</span>
                                    <span className="font-light text-xs text-foreground">{formatCurrency(Math.round((monthlyViews * 12 / 1000) * 1))}</span>
                                  </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-border/30">
                                  <ul className="space-y-2 text-xs text-muted-foreground">
                                    <li className="flex items-center gap-2">
                                      <div className="w-1 h-1 bg-foreground/30 rounded-full"></div>
                                      High engagement (5-8%)
                                    </li>
                                    <li className="flex items-center gap-2">
                                      <div className="w-1 h-1 bg-foreground/30 rounded-full"></div>
                                      Authentic content
                                    </li>
                                    <li className="flex items-center gap-2">
                                      <div className="w-1 h-1 bg-foreground/30 rounded-full"></div>
                                      Scalable reach
                                    </li>
                                    <li className="flex items-center gap-2">
                                      <div className="w-1 h-1 bg-foreground/30 rounded-full"></div>
                                      Lower acquisition cost
                                    </li>
                                  </ul>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground text-center pt-4 border-t border-border/30 mt-4">
                          Based on {formatNumber(monthlyViews)} monthly views, our clipper network saves you {formatCurrency(annualSavings)} annually compared to traditional advertising while delivering 3x higher engagement rates.
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="text-center pt-4">
                  <Button asChild className="w-full bg-foreground text-background hover:bg-foreground/90" size="default">
                    <Link
                      href="https://calendly.com/bykevingeorge/30min?month=2025-05"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Get Started
                    </Link>
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