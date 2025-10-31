"use client"

import Image from "next/image"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

interface SwiviLogoProps {
  className?: string
  size?: number
}

export function SwiviLogo({ className = "", size = 40 }: SwiviLogoProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use resolvedTheme to handle system theme, fallback to theme
  const currentTheme = mounted ? (resolvedTheme || theme) : 'dark'
  
  // Use inverted2.png for light theme (dark logo) and SwiviLogo.png for dark theme (white logo)
  const logoSrc = currentTheme === 'light' 
    ? "https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/inverted2.png"
    : "https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/SwiviLogo.png"

  return (
    <div className={`relative ${className}`}>
      <Image
        src={logoSrc}
        alt="Swivi Logo"
        width={size}
        height={size}
        className="object-contain"
        priority
      />
    </div>
  )
}

// Background graphics component for login/signup pages
export function BackgroundGraphics() {
  return (
    <div className="absolute inset-0 z-0">
      {/* Large geometric diamond shapes */}
      <div className="absolute top-16 right-16 w-96 h-96 opacity-10">
        <svg viewBox="0 0 400 400" className="w-full h-full text-white">
          <path
            d="M200 50 L350 200 L200 350 L50 200 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="animate-pulse"
          />
          <path
            d="M200 100 L300 200 L200 300 L100 200 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="animate-pulse"
          />
          <path
            d="M200 150 L250 200 L200 250 L150 200 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="animate-pulse"
          />
        </svg>
      </div>

      {/* Circular wave pattern */}
      <div className="absolute bottom-32 left-16 w-80 h-80 opacity-8">
        <svg viewBox="0 0 300 300" className="w-full h-full text-white">
          <circle
            cx="150"
            cy="150"
            r="120"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="animate-pulse"
          />
          <circle
            cx="150"
            cy="150"
            r="80"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="animate-pulse"
          />
          <circle
            cx="150"
            cy="150"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="animate-pulse"
          />
        </svg>
      </div>

      {/* Scattered geometric dots */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 opacity-5">
        <svg viewBox="0 0 200 200" className="w-full h-full text-white">
          {Array.from({ length: 25 }, (_, i) => {
            const shapes = ['circle', 'square', 'triangle'];
            const shape = shapes[i % shapes.length];
            const x = (i * 23) % 200;
            const y = (i * 31) % 200;

            if (shape === 'circle') {
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={Math.random() * 4 + 2}
                  fill="currentColor"
                  className="animate-pulse"
                  style={{
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${Math.random() * 2 + 2}s`
                  }}
                />
              );
            } else if (shape === 'square') {
              return (
                <rect
                  key={i}
                  x={x - 2}
                  y={y - 2}
                  width={Math.random() * 6 + 3}
                  height={Math.random() * 6 + 3}
                  fill="currentColor"
                  className="animate-pulse"
                  style={{
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${Math.random() * 2 + 2}s`
                  }}
                />
              );
            } else {
              return (
                <polygon
                  key={i}
                  points={`${x},${y - 3} ${x - 3},${y + 2} ${x + 3},${y + 2}`}
                  fill="currentColor"
                  className="animate-pulse"
                  style={{
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${Math.random() * 2 + 2}s`
                  }}
                />
              );
            }
          })}
        </svg>
      </div>

      {/* Corner accent with zigzag */}
      <div className="absolute top-0 right-0 w-48 h-48 opacity-6">
        <svg viewBox="0 0 100 100" className="w-full h-full text-white">
          <path
            d="M100 0 L100 30 L70 30 L70 60 L40 60 L40 100 L0 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="animate-pulse"
          />
        </svg>
      </div>

      {/* Additional floating elements */}
      <div className="absolute top-1/2 right-1/4 w-32 h-32 opacity-4">
        <svg viewBox="0 0 100 100" className="w-full h-full text-white">
          <path
            d="M50 20 L80 50 L50 80 L20 50 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="animate-pulse"
          />
        </svg>
      </div>

      <div className="absolute bottom-1/4 right-8 w-40 h-40 opacity-3">
        <svg viewBox="0 0 100 100" className="w-full h-full text-white">
          <circle
            cx="50"
            cy="50"
            r="30"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="animate-pulse"
          />
          <circle
            cx="50"
            cy="50"
            r="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="animate-pulse"
          />
        </svg>
      </div>
    </div>
  );
}
