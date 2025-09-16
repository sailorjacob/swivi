"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Play, DollarSign, TrendingUp, Users, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface OnboardingStep {
  id: string
  title: string
  description: string
  content: React.ReactNode
  completed: boolean
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to Swivi Clippers",
    description: "Learn how to turn your editing skills into income",
    completed: false,
    content: (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-light mb-4">Welcome to the Future of Content Creation</h3>
          <p className="text-muted-foreground leading-relaxed">
            You're about to join an exclusive community of content creators who earn real money 
            by creating viral clips for top creators. Let's get you started on your journey to 
            financial success through content creation.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 border border-black/10 rounded-lg">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <h4 className="font-medium mb-1">Earn $20-100+</h4>
            <p className="text-sm text-muted-foreground">Per approved clip</p>
          </div>
          <div className="text-center p-4 border border-black/10 rounded-lg">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <h4 className="font-medium mb-1">Top Performers</h4>
            <p className="text-sm text-muted-foreground">Earn $2,000+ monthly</p>
          </div>
          <div className="text-center p-4 border border-black/10 rounded-lg">
            <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <h4 className="font-medium mb-1">87+ Clippers</h4>
            <p className="text-sm text-muted-foreground">Growing community</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "requirements",
    title: "Understanding the Requirements",
    description: "Learn what makes a successful clip",
    completed: false,
    content: (
      <div className="space-y-6">
        <h3 className="text-2xl font-light mb-4">Clip Requirements & Guidelines</h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 border border-black/10 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium mb-1">Engagement Rate: 0.5% minimum</h4>
              <p className="text-sm text-muted-foreground">
                Calculated as (Likes + Comments + Shares) ÷ Views × 100. 
                For example: 1,000 views with 7 engagements = 0.7% (qualifies)
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 border border-black/10 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium mb-1">Duration: 7+ seconds</h4>
              <p className="text-sm text-muted-foreground">
                All clips must be longer than 7 seconds to qualify for payout.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 border border-black/10 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium mb-1">Public Engagement Stats</h4>
              <p className="text-sm text-muted-foreground">
                Keep your likes, comments, and views public so we can track performance.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 border border-black/10 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium mb-1">Daily Limit: 30 clips</h4>
              <p className="text-sm text-muted-foreground">
                You can post up to 30 clips per day to prevent spam and keep quality high.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "platforms",
    title: "Supported Platforms",
    description: "Where you can create and submit clips",
    completed: false,
    content: (
      <div className="space-y-6">
        <h3 className="text-2xl font-light mb-4">Platform Support</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 border border-black/10 rounded-lg">
            <h4 className="font-medium mb-2 text-red-500">🎵 TikTok</h4>
            <p className="text-sm text-muted-foreground">
              Perfect for viral short-form content. Great engagement rates and discovery.
            </p>
          </div>
          
          <div className="p-4 border border-black/10 rounded-lg">
            <h4 className="font-medium mb-2 text-red-600">📺 YouTube Shorts</h4>
            <p className="text-sm text-muted-foreground">
              Excellent for reaching YouTube's massive audience. High revenue potential.
            </p>
          </div>
          
          <div className="p-4 border border-black/10 rounded-lg">
            <h4 className="font-medium mb-2 text-purple-600">📸 Instagram Reels</h4>
            <p className="text-sm text-muted-foreground">
              Great for lifestyle and entertainment content. Strong engagement from followers.
            </p>
          </div>
          
          <div className="p-4 border border-black/10 rounded-lg">
            <h4 className="font-medium mb-2 text-blue-500">🐦 X (Twitter)</h4>
            <p className="text-sm text-muted-foreground">
              Perfect for news, commentary, and trending topics. Fast virality potential.
            </p>
          </div>
        </div>
        
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Pro Tip:</strong> You can connect multiple accounts from each platform. 
            There's no limit to how many accounts you can link to maximize your earning potential.
          </p>
        </div>
      </div>
    )
  },
  {
    id: "process",
    title: "The Clipper Process",
    description: "Step-by-step workflow for success",
    completed: false,
    content: (
      <div className="space-y-6">
        <h3 className="text-2xl font-light mb-4">How It Works</h3>
        
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium">
              1
            </div>
            <div>
              <h4 className="font-medium mb-1">Join Active Campaigns</h4>
              <p className="text-sm text-muted-foreground">
                Browse active campaigns in our Discord. Each campaign provides specific content, 
                guidelines, and payout structures.
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium">
              2
            </div>
            <div>
              <h4 className="font-medium mb-1">Create Viral Clips</h4>
              <p className="text-sm text-muted-foreground">
                Access high-quality content from verified creators. Use our guidelines to create 
                clips that capture attention and drive engagement.
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium">
              3
            </div>
            <div>
              <h4 className="font-medium mb-1">Submit for Review</h4>
              <p className="text-sm text-muted-foreground">
                Submit your clips immediately after posting. Use "scan account" for automatic 
                detection or manually submit clip links.
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium">
              4
            </div>
            <div>
              <h4 className="font-medium mb-1">Track & Earn</h4>
              <p className="text-sm text-muted-foreground">
                Monitor your performance in real-time. Stats update every 2 hours. 
                Get paid within one week of campaign completion.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "earnings",
    title: "Understanding Earnings",
    description: "How payments and tracking work",
    completed: false,
    content: (
      <div className="space-y-6">
        <h3 className="text-2xl font-light mb-4">Earnings & Payments</h3>
        
        <div className="space-y-4">
          <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
            <h4 className="font-medium mb-2 text-green-800">💰 Payment Structure</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Each campaign has different payout rates</li>
              <li>• Maximum 30% of total budget per clipper</li>
              <li>• Views from all your clips add up together</li>
              <li>• PayPal payments within one week of campaign end</li>
            </ul>
          </div>
          
          <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-2 text-blue-800">📊 Performance Tracking</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Stats update automatically every 2 hours</li>
              <li>• Real-time leaderboards show your ranking</li>
              <li>• Final update before campaign closes</li>
              <li>• DM notifications for approvals and payments</li>
            </ul>
          </div>
          
          <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
            <h4 className="font-medium mb-2 text-yellow-800">⚠️ Important Notes</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Views don't carry over between campaigns</li>
              <li>• Suspicious engagement can result in permanent bans</li>
              <li>• Keep engagement stats public during campaigns</li>
              <li>• Submit clips early for best performance tracking</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }
]

export function ClippersOnboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const progress = ((currentStep + 1) / onboardingSteps.length) * 100

  const handleNext = () => {
    setCompletedSteps(prev => new Set(prev).add(currentStep))
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex)
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-light">Clipper Onboarding</h2>
          <span className="text-sm text-muted-foreground">
            {currentStep + 1} of {onboardingSteps.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Navigation */}
      <div className="flex flex-wrap gap-2 mb-8">
        {onboardingSteps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => handleStepClick(index)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              currentStep === index
                ? 'bg-black text-white'
                : completedSteps.has(index)
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {completedSteps.has(index) ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{step.title}</span>
            <span className="sm:hidden">{index + 1}</span>
          </button>
        ))}
      </div>

      {/* Current Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-light">
                {onboardingSteps[currentStep].title}
              </CardTitle>
              <p className="text-muted-foreground">
                {onboardingSteps[currentStep].description}
              </p>
            </CardHeader>
            <CardContent>
              {onboardingSteps[currentStep].content}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-4">
          {currentStep === onboardingSteps.length - 1 ? (
            <Button
              onClick={() => window.open('https://discord.gg/CtZ4tecJ7Y', '_blank')}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4" />
              Join Discord Community
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <Button variant="outline" size="sm" className="justify-start">
            <HelpCircle className="mr-2 h-4 w-4" />
            View FAQ
          </Button>
          <Button variant="outline" size="sm" className="justify-start">
            <Users className="mr-2 h-4 w-4" />
            Join Community
          </Button>
          <Button variant="outline" size="sm" className="justify-start">
            <TrendingUp className="mr-2 h-4 w-4" />
            View Analytics
          </Button>
        </div>
      </div>
    </div>
  )
}
