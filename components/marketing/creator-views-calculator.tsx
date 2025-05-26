"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Video, Share2, Calendar, TrendingUp, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"

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
    viewsPerPost: 35000
  })

  const [monthlyViews, setMonthlyViews] = useState(0)
  const [annualSavings, setAnnualSavings] = useState(0)

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
    // Assuming $30 CPM (cost per thousand views) for traditional ads
    const cpmRate = 30
    const annualAdCost = (annualViews / 1000) * cpmRate
    
    setMonthlyViews(Math.round(totalMonthlyViews))
    setAnnualSavings(Math.round(annualAdCost))
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
    <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-transparent">
      <div className="max-width-wrapper section-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl"
        >
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="secondary">NEW CALCULATOR</Badge>
            <h2 className="text-3xl md:text-4xl font-light mb-4">
              Creator Views Calculator
            </h2>
            <p className="text-lg text-muted-foreground">
              See the massive reach and savings potential of clipper marketing
            </p>
          </div>

          <Card className="mb-8 border-2">
            <CardHeader>
              <CardTitle className="text-xl font-normal flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Adjust Your Campaign Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Number of Clippers */}
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Number of Clippers</label>
                  </div>
                  <span className="text-2xl font-light text-primary">{values.numberOfClippers} CLIPPERS</span>
                </div>
                <Slider
                  value={[values.numberOfClippers]}
                  onValueChange={(value: number[]) => handleSliderChange('numberOfClippers', value)}
                  min={1}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>10</span>
                  <span>20</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>
              </div>

              {/* Posts per Day */}
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Posts per Day (per platform)</label>
                  </div>
                  <span className="text-2xl font-light text-primary">{values.postsPerDay} POSTS</span>
                </div>
                <Slider
                  value={[values.postsPerDay]}
                  onValueChange={(value: number[]) => handleSliderChange('postsPerDay', value)}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
              </div>

              {/* Number of Platforms */}
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Number of Social Media Platforms</label>
                  </div>
                  <span className="text-2xl font-light text-primary">{values.platforms}</span>
                </div>
                <Slider
                  value={[values.platforms]}
                  onValueChange={(value: number[]) => handleSliderChange('platforms', value)}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
              </div>

              {/* Days per Week */}
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Days per Week Clippers Post</label>
                  </div>
                  <span className="text-2xl font-light text-primary">{values.daysPerWeek} DAYS</span>
                </div>
                <Slider
                  value={[values.daysPerWeek]}
                  onValueChange={(value: number[]) => handleSliderChange('daysPerWeek', value)}
                  min={1}
                  max={7}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>3</span>
                  <span>5</span>
                  <span>7</span>
                </div>
              </div>

              {/* Views per Post */}
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Views per Post</label>
                  </div>
                  <span className="text-2xl font-light text-primary">{formatNumber(values.viewsPerPost)}</span>
                </div>
                <Slider
                  value={[values.viewsPerPost]}
                  onValueChange={(value: number[]) => handleSliderChange('viewsPerPost', value)}
                  min={400}
                  max={35000}
                  step={100}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>400</span>
                  <span>5K</span>
                  <span>10K</span>
                  <span>20K</span>
                  <span>35K</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Display */}
          <div className="space-y-6">
            {/* Monthly Views */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Card className="border-primary border-2 bg-primary/5">
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-2">MONTHLY VIEWS FROM CLIPPERS:</p>
                  <p className="text-4xl md:text-5xl font-light text-primary mb-2">
                    {formatNumber(monthlyViews)} 🧀
                  </p>
                  <p className="text-sm text-muted-foreground">
                    That's {formatNumber(Math.round(monthlyViews / 30))} views per day!
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Annual Savings */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Card className="border-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-2">ANNUAL SAVINGS VS TRADITIONAL PAID ADS:</p>
                  <p className="text-4xl md:text-5xl font-light text-green-600 dark:text-green-400 mb-2">
                    {formatCurrency(annualSavings)} 🤯
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Based on $30 CPM industry average
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-2xl font-light mb-1">
                    {formatNumber(values.numberOfClippers * values.postsPerDay * values.platforms * values.daysPerWeek)}
                  </p>
                  <p className="text-sm text-muted-foreground">Posts per Week</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-2xl font-light mb-1">
                    {formatNumber(Math.round(monthlyViews * 12))}
                  </p>
                  <p className="text-sm text-muted-foreground">Annual Views</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-2xl font-light mb-1">
                    {formatCurrency(Math.round(annualSavings / 12))}
                  </p>
                  <p className="text-sm text-muted-foreground">Monthly Savings</p>
                </CardContent>
              </Card>
            </div>

            {/* Info Box */}
            <Card className="bg-muted/50">
              <CardContent className="p-6">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Why This Matters
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Traditional paid ads cost $20-50 per 1,000 views (CPM)</li>
                  <li>• Organic content from clippers has higher engagement rates</li>
                  <li>• Authentic creator content converts 3x better than ads</li>
                  <li>• Scale your reach without scaling your ad spend</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 