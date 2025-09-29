"use client"

import Image from "next/image"
import { useState, useEffect } from "react"

interface BottomBackgroundProps {
  src: string
  alt: string
  className?: string
  animate?: boolean
}

export function BottomBackground({
  src,
  alt,
  className = "",
  animate = true
}: BottomBackgroundProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Simple delay to let page load, then show
    const timer = setTimeout(() => setIsVisible(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-0
        transition-all duration-1000 ease-out
        ${animate ? (isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8") : "opacity-100"}
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
