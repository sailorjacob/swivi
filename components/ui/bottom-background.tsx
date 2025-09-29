"use client"

import Image from "next/image"
import { useState, useEffect } from "react"

interface BottomBackgroundProps {
  src: string
  alt: string
  className?: string
  animate?: boolean
  triggerScroll?: number // Percentage of page height to trigger (default 50%)
}

export function BottomBackground({
  src,
  alt,
  className = "",
  animate = true,
  triggerScroll = 50
}: BottomBackgroundProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const docHeight = document.documentElement.offsetHeight
      const scrollPercent = (scrollTop / (docHeight - windowHeight)) * 100

      if (scrollPercent >= triggerScroll && !hasTriggered) {
        setHasTriggered(true)
        setTimeout(() => setIsVisible(true), 300) // Small delay after trigger
      }
    }

    // Only add scroll listener if not triggered yet
    if (!hasTriggered) {
      window.addEventListener('scroll', handleScroll, { passive: true })
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [triggerScroll, hasTriggered])

  // Always start hidden - only show when triggered and visible
  const shouldShow = hasTriggered && isVisible

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-0
        transition-all duration-1500 ease-out
        ${animate ? (shouldShow ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none") : shouldShow ? "opacity-100" : "opacity-0 pointer-events-none"}
        ${className}
      `}
    >
      <div className="relative w-full h-32 overflow-hidden">
        {/* Main image that sprouts from bottom */}
        <Image
          src={src}
          alt={alt}
          width={400}
          height={400}
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-auto h-auto max-w-sm object-cover object-bottom"
          style={{
            filter: "brightness(0.8) contrast(1.1)",
          }}
          unoptimized
        />

        {/* Gradient overlay to fade into background */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>
    </div>
  )
}
