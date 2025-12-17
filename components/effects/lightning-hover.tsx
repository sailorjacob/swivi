"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Particle {
  id: number
  x: number
  y: number
  emoji: string
  rotation: number
  scale: number
  velocityX: number
  velocityY: number
}

interface LightningHoverProps {
  children: React.ReactNode
  className?: string
}

const lightningEmojis = ["⚡", "⚡", "⚡", "✨", "💥"]

export function LightningHover({ children, className = "" }: LightningHoverProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [isHovering, setIsHovering] = useState(false)
  const particleIdRef = useRef(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const spawnParticle = (rect: DOMRect) => {
    const id = particleIdRef.current++
    
    // Random position around the element
    const angle = Math.random() * Math.PI * 2
    const distance = 20 + Math.random() * 30
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    const x = centerX + Math.cos(angle) * distance
    const y = centerY + Math.sin(angle) * distance
    
    const speed = Math.random() * 3 + 2
    
    const newParticle: Particle = {
      id,
      x,
      y,
      emoji: lightningEmojis[Math.floor(Math.random() * lightningEmojis.length)],
      rotation: Math.random() * 360,
      scale: Math.random() * 0.5 + 0.5,
      velocityX: (Math.random() - 0.5) * speed,
      velocityY: -speed - Math.random() * 2, // upward motion
    }
    
    setParticles(prev => [...prev, newParticle])
    
    // Remove particle after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== id))
    }, 1000)
  }

  const handleMouseEnter = () => {
    setIsHovering(true)
    
    // Spawn particles continuously while hovering
    intervalRef.current = setInterval(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const relativeRect = {
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
          top: 0,
          left: 0,
          right: containerRef.current.offsetWidth,
          bottom: containerRef.current.offsetHeight,
          x: 0,
          y: 0,
          toJSON: () => {}
        } as DOMRect
        
        // Spawn 2-3 particles at once
        const particleCount = Math.floor(Math.random() * 2) + 2
        for (let i = 0; i < particleCount; i++) {
          spawnParticle(relativeRect)
        }
      }
    }, 150)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {/* Particle container */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        <AnimatePresence>
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                x: particle.x,
                y: particle.y,
                scale: particle.scale,
                rotate: particle.rotation,
                opacity: 1,
              }}
              animate={{
                x: particle.x + particle.velocityX * 30,
                y: particle.y + particle.velocityY * 60,
                scale: particle.scale * 0.2,
                rotate: particle.rotation + (Math.random() > 0.5 ? 360 : -360),
                opacity: 0,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1,
                ease: "easeOut",
              }}
              className="absolute text-2xl select-none"
              style={{
                filter: "drop-shadow(0 0 8px rgba(255,215,0,0.8))",
              }}
            >
              {particle.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

