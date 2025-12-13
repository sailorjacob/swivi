"use client"

import { useEffect, useRef, useState } from "react"
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

interface EmojiTrailProps {
  emojis?: string[]
}

const defaultMoneyEmojis = ["💸", "💵", "💰", "🤑", "💲", "🪙"]

export function EmojiTrail({ emojis = defaultMoneyEmojis }: EmojiTrailProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const particleIdRef = useRef(0)
  const lastSpawnRef = useRef(0)
  const lastPosRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      const timeSinceLastSpawn = now - lastSpawnRef.current
      
      // Calculate distance moved
      const dx = e.clientX - lastPosRef.current.x
      const dy = e.clientY - lastPosRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // Spawn particles based on distance and time (machine gun effect)
      const spawnInterval = 30 // ms between spawns
      const minDistance = 5 // minimum pixels moved
      
      if (timeSinceLastSpawn > spawnInterval && distance > minDistance) {
        lastSpawnRef.current = now
        lastPosRef.current = { x: e.clientX, y: e.clientY }
        
        // Spawn 2-4 particles at once for density
        const particleCount = Math.floor(Math.random() * 3) + 2
        const newParticles: Particle[] = []
        
        for (let i = 0; i < particleCount; i++) {
          const id = particleIdRef.current++
          const angle = Math.random() * Math.PI * 2
          const speed = Math.random() * 4 + 2
          
          newParticles.push({
            id,
            x: e.clientX + (Math.random() - 0.5) * 30,
            y: e.clientY + (Math.random() - 0.5) * 30,
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            rotation: Math.random() * 360,
            scale: Math.random() * 0.5 + 0.5,
            velocityX: Math.cos(angle) * speed + dx * 0.1,
            velocityY: Math.sin(angle) * speed + dy * 0.1 + 2, // slight downward bias
          })
        }
        
        setParticles(prev => [...prev, ...newParticles])
        
        // Remove particles after animation
        setTimeout(() => {
          setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)))
        }, 800)
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [emojis])

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
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
              x: particle.x + particle.velocityX * 50,
              y: particle.y + particle.velocityY * 80 + 100, // gravity effect
              scale: particle.scale * 0.3,
              rotate: particle.rotation + (Math.random() > 0.5 ? 180 : -180),
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
            }}
            className="absolute text-2xl select-none"
            style={{
              left: 0,
              top: 0,
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
            }}
          >
            {particle.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Backwards compatible export
export function MoneyTrail() {
  return <EmojiTrail emojis={defaultMoneyEmojis} />
}

