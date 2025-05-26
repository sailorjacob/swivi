"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

interface Testimonial {
  id: string
  name: string
  role: string
  company: string
  content: string
  rating: number
  image?: string
  verified: boolean
}

// This would typically come from a database
const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    role: "Content Creator",
    company: "@sarahcreates",
    content: "Swivimedia helped me go from 10K to 100K followers in just 3 months. Their viral content strategy is unmatched!",
    rating: 5,
    image: "/testimonials/sarah.jpg",
    verified: true
  },
  {
    id: "2",
    name: "Mike Chen",
    role: "Brand Manager",
    company: "TechStart Inc.",
    content: "The ROI we've seen from working with Swivimedia is incredible. Our engagement rates have increased by 400%.",
    rating: 5,
    image: "/testimonials/mike.jpg",
    verified: true
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    role: "Influencer",
    company: "@emilylifestyle",
    content: "I'm now earning $30K+ per month thanks to their content optimization strategies. Life-changing!",
    rating: 5,
    image: "/testimonials/emily.jpg",
    verified: true
  },
  {
    id: "4",
    name: "David Park",
    role: "CEO",
    company: "Fashion Forward",
    content: "Our brand went viral multiple times after implementing Swivimedia's strategies. Sales increased by 250%.",
    rating: 5,
    image: "/testimonials/david.jpg",
    verified: true
  }
]

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const handlePrevious = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const handleNext = () => {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const handleDotClick = (index: number) => {
    setIsAutoPlaying(false)
    setCurrentIndex(index)
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
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light mb-4">
              Success Stories
          </h2>
            <p className="text-lg text-muted-foreground">
              Real results from real creators and brands
            </p>
        </div>

          <div className="relative">
            {/* Testimonial Carousel */}
            <div className="overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
            >
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-8 md:p-12">
                      <Quote className="h-8 w-8 text-primary/20 mb-4" />
                      
                      {/* Rating */}
                      <div className="flex gap-1 mb-4">
                        {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-primary text-primary" />
          ))}
        </div>

                      {/* Content */}
                      <p className="text-lg md:text-xl mb-6 leading-relaxed">
                        "{testimonials[currentIndex].content}"
                      </p>

                      {/* Author */}
                      <div className="flex items-center gap-4">
                        {testimonials[currentIndex].image && (
                          <div className="relative h-12 w-12 rounded-full overflow-hidden bg-muted">
                            {/* Placeholder for image */}
                            <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/10" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{testimonials[currentIndex].name}</p>
                            {testimonials[currentIndex].verified && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                Verified
                              </span>
                            )}
                          </div>
          <p className="text-sm text-muted-foreground">
                            {testimonials[currentIndex].role} • {testimonials[currentIndex].company}
          </p>
        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between pointer-events-none">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevious}
                className="pointer-events-auto -translate-x-1/2 md:translate-x-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                className="pointer-events-auto translate-x-1/2 md:translate-x-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    index === currentIndex
                      ? "bg-primary w-8"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            <div>
              <p className="text-3xl font-light mb-1">500+</p>
              <p className="text-sm text-muted-foreground">Happy Clients</p>
            </div>
            <div>
              <p className="text-3xl font-light mb-1">$2M+</p>
              <p className="text-sm text-muted-foreground">Revenue Generated</p>
            </div>
            <div>
              <p className="text-3xl font-light mb-1">1B+</p>
              <p className="text-sm text-muted-foreground">Views Delivered</p>
            </div>
            <div>
              <p className="text-3xl font-light mb-1">98%</p>
              <p className="text-sm text-muted-foreground">Success Rate</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
} 