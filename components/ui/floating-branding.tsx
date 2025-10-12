"use client"

import Image from "next/image"
import { useState, useEffect, useMemo } from "react"

interface FloatingBrandingProps {
  src: string
  alt: string
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  animate?: boolean
  randomPosition?: boolean
  randomDelay?: boolean
}

export function FloatingBranding({
  src,
  alt,
  position = "top-right",
  size = "md",
  className = "",
  animate = true,
  randomPosition = true,
  randomDelay = true
}: FloatingBrandingProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(true) // Start expanded
  const [isPastFirstSection, setIsPastFirstSection] = useState(false)

  // Randomize position and timing for each render
  const randomConfig = useMemo(() => {
    if (!randomPosition && !randomDelay) {
      return {
        position,
        delay: 1000,
        offsetX: 0,
        offsetY: 0
      }
    }

    const positions: Array<"top-left" | "top-right" | "bottom-left" | "bottom-right"> = [
      "top-left", "top-right", "bottom-left", "bottom-right"
    ]

    const randomPos = randomPosition ? positions[Math.floor(Math.random() * positions.length)] : position
    const baseDelay = randomDelay ? Math.random() * 2000 + 500 : 1000 // 0.5-2.5s random delay
    const offsetX = randomPosition ? (Math.random() - 0.5) * 40 : 0 // -20px to +20px
    const offsetY = randomPosition ? (Math.random() - 0.5) * 40 : 0 // -20px to +20px

    return {
      position: randomPos,
      delay: baseDelay,
      offsetX,
      offsetY
    }
  }, [position, randomPosition, randomDelay])

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), randomConfig.delay)
    return () => clearTimeout(timer)
  }, [randomConfig.delay])

  // Add scroll detection to collapse when past first section
  useEffect(() => {
    const handleScroll = () => {
      // Different scroll thresholds based on element position
      let scrollThreshold = window.innerHeight * 0.8

      // Bottom elements need a lower threshold since they're positioned from bottom
      if (randomConfig.position.includes('bottom')) {
        scrollThreshold = window.innerHeight * 0.6
      }

      setIsPastFirstSection(window.scrollY > scrollThreshold)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [randomConfig.position])

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20",
    xl: "w-32 h-32"
  }

  const positionClasses = {
    "top-left": "top-24 left-4",
    "top-right": "top-24 right-4",
    "bottom-left": "bottom-24 left-4",
    "bottom-right": "bottom-24 right-4"
  }

  return (
    <div
      className={`
        fixed ${positionClasses[randomConfig.position]} z-40
        transition-all duration-1000 ease-out
        ${animate ? (isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4") : "opacity-100"}
        ${className}
      `}
      style={{
        transform: `translate(${randomConfig.offsetX}px, ${randomConfig.offsetY}px)`
      }}
    >
      <div
        className={`
          ${isHovered || !isPastFirstSection ? sizeClasses.xl : sizeClasses[size]}
          rounded-full overflow-hidden transition-all duration-500 ease-out
          border-2 border-border/20
          bg-background/80 backdrop-blur-sm
          hover:border-border/40
          cursor-pointer hover:shadow-lg
          ${isHovered || !isPastFirstSection ? 'scale-125 shadow-2xl' : 'hover:scale-110'}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Image
          src={src}
          alt={alt}
          width={(isHovered || !isPastFirstSection) ? 128 : 80}
          height={(isHovered || !isPastFirstSection) ? 128 : 80}
          className="w-full h-full object-cover transition-all duration-500"
          unoptimized
        />
      </div>
    </div>
  )
}
