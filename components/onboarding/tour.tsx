"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronRight, ChevronLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface TourStep {
  id: string
  title: string
  description: string
  target?: string // CSS selector for highlighting
  position?: "top" | "bottom" | "left" | "right"
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Swivimedia! 👋",
    description: "Let's take a quick tour to help you get started with viral content creation.",
  },
  {
    id: "calculator",
    title: "Calculate Your Earnings",
    description: "Use our interactive calculator to see your potential earnings based on your content performance.",
    target: "#earnings-calculator",
    position: "top"
  },
  {
    id: "community",
    title: "Join the Community",
    description: "Connect with other creators, share strategies, and learn from the best in our Discord-like chat.",
    target: "#community-chat",
    position: "bottom"
  },
  {
    id: "testimonials",
    title: "Success Stories",
    description: "See real results from creators who've transformed their content game with our strategies.",
    target: "#testimonials",
    position: "top"
  },
  {
    id: "cta",
    title: "Ready to Go Viral?",
    description: "Book a call with our team to start your journey to $30K+ monthly earnings!",
    target: "#book-call",
    position: "bottom"
  }
]

interface OnboardingTourProps {
  onComplete?: () => void
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasSeenTour, setHasSeenTour] = useState(false)

  useEffect(() => {
    // Check if user has seen the tour
    const tourSeen = localStorage.getItem("swivimedia-tour-completed")
    if (!tourSeen) {
      setIsActive(true)
    } else {
      setHasSeenTour(true)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTour()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    completeTour()
  }

  const completeTour = () => {
    setIsActive(false)
    localStorage.setItem("swivimedia-tour-completed", "true")
    onComplete?.()
  }

  const restartTour = () => {
    setCurrentStep(0)
    setIsActive(true)
  }

  if (!isActive && hasSeenTour) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Button
          onClick={restartTour}
          variant="outline"
          size="sm"
          className="shadow-lg"
        >
          Restart Tour
        </Button>
      </motion.div>
    )
  }

  if (!isActive) return null

  const currentStepData = tourSteps[currentStep]
  const progress = ((currentStep + 1) / tourSteps.length) * 100

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleSkip}
          />

          {/* Tour Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <Card className="shadow-2xl">
              <CardContent className="p-6">
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Step {currentStep + 1} of {tourSteps.length}
                  </p>
                </div>

                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleSkip}
                >
                  <X className="h-4 w-4" />
                </Button>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold pr-8">
                    {currentStepData.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {currentStepData.description}
                  </p>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSkip}
                    >
                      Skip Tour
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleNext}
                    >
                      {currentStep === tourSteps.length - 1 ? (
                        <>
                          Complete
                          <Check className="h-4 w-4 ml-1" />
                        </>
                      ) : (
                        <>
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
} 