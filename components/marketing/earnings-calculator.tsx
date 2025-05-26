"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { DollarSign, TrendingUp, Target, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"

interface CalculatorValues {
  clipsPerDay: number
  viewsPerClip: number
  rpm: number
}

interface Earnings {
  daily: number
  weekly: number
  monthly: number
  quarterly: number
}

export function EarningsCalculator() {
  const [values, setValues] = useState<CalculatorValues>({
    clipsPerDay: 10,
    viewsPerClip: 5000,
    rpm: 1.5
  })

  const [earnings, setEarnings] = useState<Earnings>({
    daily: 0,
    weekly: 0,
    monthly: 0,
    quarterly: 0
  })

  const [challengeProgress, setChallengeProgress] = useState(0)

  // Calculate earnings whenever values change
  useEffect(() => {
    const daily = (values.clipsPerDay * values.viewsPerClip * values.rpm) / 1000
    const weekly = daily * 7
    const monthly = daily * 30
    const quarterly = daily * 90

    setEarnings({ daily, weekly, monthly, quarterly })
    
    // Calculate progress towards $30K challenge
    const progress = Math.min((monthly / 30000) * 100, 100)
    setChallengeProgress(progress)
  }, [values])

  const handleSliderChange = (field: keyof CalculatorValues, value: number[]) => {
    setValues(prev => ({ ...prev, [field]: value[0] }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
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
              Calculate Your Earnings Potential
            </h2>
            <p className="text-lg text-muted-foreground">
              See how much you could earn with our viral content strategy
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-normal">Adjust Your Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Clips per Day Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Clips per Day</label>
                  <span className="text-2xl font-light">{values.clipsPerDay}</span>
                </div>
                <Slider
                  value={[values.clipsPerDay]}
                  onValueChange={(value: number[]) => handleSliderChange('clipsPerDay', value)}
                  min={1}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Views per Clip Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Views per Clip</label>
                  <span className="text-2xl font-light">{formatNumber(values.viewsPerClip)}</span>
                </div>
                <Slider
                  value={[values.viewsPerClip]}
                  onValueChange={(value: number[]) => handleSliderChange('viewsPerClip', value)}
                  min={1000}
                  max={100000}
                  step={1000}
                  className="w-full"
                />
              </div>

              {/* RPM Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">RPM (Revenue per 1000 views)</label>
                  <span className="text-2xl font-light">${values.rpm.toFixed(2)}</span>
                </div>
                <Slider
                  value={[values.rpm]}
                  onValueChange={(value: number[]) => handleSliderChange('rpm', value)}
                  min={0.5}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Earnings Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Daily</span>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-light">{formatCurrency(earnings.daily)}</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Weekly</span>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-light">{formatCurrency(earnings.weekly)}</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Card className="border-primary">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Monthly</span>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-2xl font-light text-primary">{formatCurrency(earnings.monthly)}</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">90 Days</span>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-light">{formatCurrency(earnings.quarterly)}</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* $30K Challenge Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-normal flex items-center gap-2">
                <Target className="h-5 w-5" />
                $30K Monthly Challenge Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={challengeProgress} className="h-3" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current projection</span>
                  <span className="font-medium">
                    {formatCurrency(earnings.monthly)} / {formatCurrency(30000)}
                  </span>
                </div>
                {challengeProgress >= 100 ? (
                  <motion.p
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center text-primary font-medium"
                  >
                    🎉 You've reached the $30K monthly goal!
                  </motion.p>
                ) : (
                  <p className="text-center text-sm text-muted-foreground">
                    Increase your clips or views to reach the $30K goal
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
} 