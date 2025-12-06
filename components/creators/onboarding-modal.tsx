"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  CheckCircle,
  Circle,
  ArrowRight,
  ArrowLeft,
  User,
  Link as LinkIcon,
  DollarSign,
  Play,
  FileText,
  Zap,
  Users,
  TrendingUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { SwiviLogo } from "@/components/ui/icons/swivi-logo"
import Link from "next/link"
import toast from "react-hot-toast"

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  content: React.ReactNode
  completed: boolean
}

const initialSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to Swivi Creators",
    description: "Let's get you set up to start earning",
    icon: CheckCircle,
    completed: false,
    content: (
      <div className="text-center space-y-6">
        <div className="flex justify-center mb-6">
          <SwiviLogo size={64} />
        </div>
        <div>
          <h2 className="text-2xl font-light text-white mb-4">Welcome to Swivi Creators!</h2>
          <p className="text-gray-300 leading-relaxed">
            Congratulations on joining our exclusive community! You're now part of a premium network
            of content creators earning competitive payouts for viral clips. Let's get you set up in just a few steps.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="group p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 hover:border-green-500/30 transition-all duration-300">
            <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-green-500/20 transition-colors">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-white font-medium text-sm">$20-100+</p>
            <p className="text-gray-400 text-xs">per clip</p>
          </div>
          <div className="group p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 hover:border-green-500/30 transition-all duration-300">
            <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-green-500/20 transition-colors">
              <Zap className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-white font-medium text-sm">Fast Payouts</p>
            <p className="text-gray-400 text-xs">weekly</p>
          </div>
          <div className="group p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 hover:border-green-500/30 transition-all duration-300">
            <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-green-500/20 transition-colors">
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-white font-medium text-sm">Premium Community</p>
            <p className="text-gray-400 text-xs">87+ active</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "profile",
    title: "Complete Your Profile",
    description: "Add your information to get started",
    icon: User,
    completed: false,
    content: (
      <div className="space-y-6">
        <div>
          <Label htmlFor="displayName" className="text-white">Display Name</Label>
          <Input
            id="displayName"
            placeholder="How you'd like to be known"
            className="bg-gray-800 border-gray-700 text-white mt-1"
          />
        </div>

        <div>
          <Label htmlFor="bio" className="text-white">Bio (Optional)</Label>
          <Textarea
            id="bio"
            placeholder="Tell us about your editing experience..."
            className="bg-gray-800 border-gray-700 text-white mt-1"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="paypal" className="text-white">PayPal Email</Label>
          <Input
            id="paypal"
            type="email"
            placeholder="your@email.com"
            className="bg-gray-800 border-gray-700 text-white mt-1"
          />
          <p className="text-gray-400 text-sm mt-1">
            We'll use this for your payouts
          </p>
        </div>
      </div>
    )
  },
  {
    id: "social",
    title: "Connect Social Accounts",
    description: "Link your accounts to start clipping",
    icon: LinkIcon,
    completed: false,
    content: (
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-gray-300 mb-6">
            Connect at least one social media account to participate in campaigns.
            You can add more accounts later from your profile.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 p-6 h-auto group">
            <div className="text-center">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-sm">IG</span>
              </div>
              <p className="font-medium">Instagram</p>
              <p className="text-sm text-gray-400">Reels</p>
            </div>
          </Button>

          <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 p-6 h-auto group">
            <div className="text-center">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-sm">TT</span>
              </div>
              <p className="font-medium">TikTok</p>
              <p className="text-sm text-gray-400">Videos</p>
            </div>
          </Button>

          <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 p-6 h-auto group">
            <div className="text-center">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-sm">YT</span>
              </div>
              <p className="font-medium">YouTube</p>
              <p className="text-sm text-gray-400">Shorts</p>
            </div>
          </Button>

          {/* X/Twitter hidden - re-enable when Apify actors are working */}
          {/* <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 p-6 h-auto group">
            <div className="text-center">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-white/20 group-hover:scale-110 transition-all">
                <span className="text-white font-bold text-sm">X</span>
              </div>
              <p className="font-medium">Twitter/X</p>
              <p className="text-sm text-gray-400">Videos</p>
            </div>
          </Button> */}
        </div>

        <div className="p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
          <p className="text-green-300 text-sm">
            <strong>💡 Pro tip:</strong> Make sure your accounts are public and have some existing content
            to get started faster with campaign approvals.
          </p>
        </div>
      </div>
    )
  },
  {
    id: "complete",
    title: "You're All Set!",
    description: "Start exploring campaigns and earning",
    icon: CheckCircle,
    completed: false,
    content: (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>

        <div>
          <h2 className="text-2xl font-light text-white mb-4">Setup Complete!</h2>
          <p className="text-gray-300 leading-relaxed">
            Great job! You've successfully set up your Swivi Creators account.
            You're now ready to start browsing campaigns and creating viral content.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/creators/dashboard/campaigns">
            <Button className="w-full bg-green-600 hover:bg-green-700">
              <Play className="w-4 h-4 mr-2" />
              Browse Campaigns
            </Button>
          </Link>

          <Link href="/creators/dashboard/profile">
            <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800">
              <User className="w-4 h-4 mr-2" />
              Complete Profile
            </Button>
          </Link>
        </div>

        <div className="p-4 bg-gray-800 rounded-lg">
          <h3 className="text-white font-medium mb-2">Next Steps:</h3>
          <ul className="text-gray-300 text-sm space-y-1 text-left">
            <li>• Browse active campaigns in the Campaigns tab</li>
            <li>• Connect additional social accounts for more opportunities</li>
            <li>• Complete account verification for faster approvals</li>
            <li>• Join our Discord community for tips and support</li>
          </ul>
        </div>
      </div>
    )
  }
]

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState(initialSteps)
  const [isCompleted, setIsCompleted] = useState(false)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const newSteps = [...steps]
      newSteps[currentStep].completed = true
      setSteps(newSteps)
      setCurrentStep(currentStep + 1)
    } else {
      // Mark last step as completed
      const newSteps = [...steps]
      newSteps[currentStep].completed = true
      setSteps(newSteps)
      setIsCompleted(true)
      toast.success("Welcome to Swivi Creators! 🎉")
      setTimeout(() => {
        onClose()
      }, 2000)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (stepIndex: number) => {
    // Allow clicking on completed steps or the next available step
    if (stepIndex <= currentStep || steps[stepIndex - 1]?.completed) {
      setCurrentStep(stepIndex)
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Step {currentStep + 1} of {steps.length}</span>
              <span className="text-gray-400">{Math.round(progress)}% complete</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <motion.div
                className="bg-green-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStep
              const isCompleted = step.completed

              return (
                <div
                  key={step.id}
                  onClick={() => handleStepClick(index)}
                  className={`flex flex-col items-center space-y-2 cursor-pointer transition-colors ${
                    isActive ? 'text-green-400' :
                    isCompleted ? 'text-green-600' :
                    'text-gray-600'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    isActive ? 'border-green-400 bg-green-400/10' :
                    isCompleted ? 'border-green-600 bg-green-600/10' :
                    'border-gray-600'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs text-center hidden sm:block">{step.title}</span>
                </div>
              )
            })}
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="min-h-[300px]"
            >
              <div className="mb-6">
                <h2 className="text-xl font-medium text-white mb-2">
                  {steps[currentStep].title}
                </h2>
                <p className="text-gray-400">
                  {steps[currentStep].description}
                </p>
              </div>

              {steps[currentStep].content}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-800">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex space-x-2">
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                Skip for now
              </Button>

              <Button
                onClick={handleNext}
                className="bg-green-600 hover:bg-green-700"
                disabled={isCompleted}
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Setup
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
