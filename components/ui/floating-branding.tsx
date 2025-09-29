"use client"

import Image from "next/image"
import { useState, useEffect } from "react"

interface FloatingBrandingProps {
  src: string
  alt: string
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  size?: "sm" | "md" | "lg"
  className?: string
  animate?: boolean
}

export function FloatingBranding({
  src,
  alt,
  position,
  size = "md",
  className = "",
  animate = true
}: FloatingBrandingProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-20 h-20"
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
        fixed ${positionClasses[position]} z-40
        transition-all duration-1000 ease-out
        ${animate ? (isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4") : "opacity-100"}
        ${className}
      `}
    >
      <div className={`
        ${sizeClasses[size]}
        rounded-full overflow-hidden
        border-2 border-border/20
        bg-background/80 backdrop-blur-sm
        hover:border-border/40 transition-all duration-300
        cursor-pointer hover:scale-110
      `}>
        <Image
          src={src}
          alt={alt}
          width={80}
          height={80}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>
    </div>
  )
}
