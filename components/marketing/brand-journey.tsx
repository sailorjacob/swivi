"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef, useEffect } from "react"

const journeySteps = [
  {
    title: null,
    content: (
      <>
        "Hi [Name], Our creator network delivered{" "}
        <span className="text-foreground font-medium">20M+ views</span> for Netflix's Owning Manhattan at{" "}
        <span className="text-foreground font-medium">half market CPM</span>. 
        Imagine similar for [Your Brand]—let's discuss a pilot."
      </>
    ),
    showTitle: false
  },
  {
    title: null,
    content: "We listen. Your goals become ours. Your vision shapes everything we build. This is about understanding what success actually means for your brand.",
    showTitle: false
  },
  {
    title: "Proposal",
    content: "Custom strategies built around real data. Benchmarks from campaigns that actually delivered. Flexible options that grow with you.",
    showTitle: true
  },
  {
    title: null,
    content: "Honest conversations. Real numbers. No surprises. We work with partners who value transparency and results backed by millions of impressions.",
    showTitle: false
  },
  {
    title: "Delivery",
    content: "We work with a select group of partners to ensure every campaign gets the attention it deserves. Quality over quantity, always.",
    showTitle: true
  }
]

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  baseY: number
  phase: number
}

function LiquidMetal({ side, index }: { side: 'left' | 'right', index: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>()
  const scrollRef = useRef(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = 600 * dpr
    canvas.height = 800 * dpr
    canvas.style.width = '600px'
    canvas.style.height = '800px'
    ctx.scale(dpr, dpr)

    // Initialize particles for liquid effect
    const particles: Particle[] = []
    const particleCount = 25
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: side === 'left' ? 150 + Math.random() * 200 : 250 + Math.random() * 200,
        y: 200 + i * 25,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 30 + Math.random() * 40,
        baseY: 200 + i * 25,
        phase: Math.random() * Math.PI * 2
      })
    }
    particlesRef.current = particles

    const animate = () => {
      ctx.clearRect(0, 0, 600, 800)
      
      const scrollOffset = scrollRef.current * 200

      // Update and draw particles with physics
      particles.forEach((p, i) => {
        // Wave motion
        p.phase += 0.02
        p.x += Math.sin(p.phase) * 0.5
        p.y = p.baseY + Math.cos(p.phase * 0.7) * 30 - scrollOffset

        // Gravity and fluid dynamics
        p.vx += (Math.random() - 0.5) * 0.1
        p.vy += 0.05
        
        p.x += p.vx
        p.y += p.vy

        // Damping
        p.vx *= 0.95
        p.vy *= 0.95

        // Boundaries with bounce
        const margin = p.radius
        if (side === 'left') {
          if (p.x < margin) {
            p.x = margin
            p.vx *= -0.7
          }
          if (p.x > 300) {
            p.x = 300
            p.vx *= -0.7
          }
        } else {
          if (p.x < 300) {
            p.x = 300
            p.vx *= -0.7
          }
          if (p.x > 600 - margin) {
            p.x = 600 - margin
            p.vx *= -0.7
          }
        }

        // Wrap vertically
        if (p.y > 900) p.y = -100
        if (p.y < -100) p.y = 900
      })

      // Create metaball effect with gradient
      const imageData = ctx.createImageData(600, 800)
      const data = imageData.data

      for (let x = 0; x < 600; x += 2) {
        for (let y = 0; y < 800; y += 2) {
          let sum = 0
          
          particles.forEach(p => {
            const dx = x - p.x
            const dy = y - p.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < p.radius * 3) {
              sum += (p.radius * p.radius) / (dist * dist + 1)
            }
          })

          if (sum > 0.8) {
            const idx = (y * 600 + x) * 4
            const idx2 = (y * 600 + x + 1) * 4
            const idx3 = ((y + 1) * 600 + x) * 4
            const idx4 = ((y + 1) * 600 + x + 1) * 4

            // Metallic silver color with gradient
            const intensity = Math.min(sum * 80, 255)
            const highlight = Math.min(sum * 120, 255)
            
            // Silver metallic RGB
            const r = Math.floor(192 + intensity * 0.2)
            const g = Math.floor(192 + intensity * 0.2)
            const b = Math.floor(192 + intensity * 0.25)
            const a = Math.min(intensity * 1.5, 180)

            for (let i of [idx, idx2, idx3, idx4]) {
              if (i >= 0 && i < data.length) {
                data[i] = r
                data[i + 1] = g
                data[i + 2] = b
                data[i + 3] = a
              }
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0)

      // Add highlights and shine
      particles.forEach(p => {
        if (p.y > -100 && p.y < 900) {
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 1.2)
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)')
          gradient.addColorStop(0.4, 'rgba(220, 220, 220, 0.2)')
          gradient.addColorStop(1, 'rgba(180, 180, 180, 0)')
          
          ctx.fillStyle = gradient
          ctx.fillRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2)
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [side])

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (latest) => {
      scrollRef.current = latest
    })
    return () => unsubscribe()
  }, [scrollYProgress])

  return (
    <motion.div
      ref={containerRef}
      className={`absolute ${side === 'left' ? '-left-32' : '-right-32'} top-1/2 -translate-y-1/2 pointer-events-none overflow-visible`}
      style={{
        filter: 'blur(0.5px) drop-shadow(0 10px 30px rgba(0,0,0,0.3))',
      }}
    >
      <canvas
        ref={canvasRef}
        className="opacity-40"
        style={{
          mixBlendMode: 'normal',
        }}
      />
    </motion.div>
  )
}

function StorySection({ step, index }: { step: typeof journeySteps[0], index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })

  const opacity = useTransform(scrollYProgress, [0.3, 0.5, 0.7], [0.3, 1, 0.3])
  const scale = useTransform(scrollYProgress, [0.3, 0.5, 0.7], [0.95, 1, 0.95])
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [100, 0, -100])

  return (
    <motion.div
      ref={ref}
      style={{ opacity, scale, y }}
      className="relative min-h-screen flex items-center justify-center py-20 overflow-hidden"
    >
      {/* Liquid Metal Effects */}
      <LiquidMetal side="left" index={index} />
      <LiquidMetal side="right" index={index} />

      <div className="max-width-wrapper section-padding text-center relative z-10">
        <motion.div className="space-y-6">
          {step.showTitle && step.title && (
            <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-tight leading-[0.9]">
              {step.title}
            </h2>
          )}
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-light">
            {step.content}
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}

function LiquidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>()
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.scale(dpr, dpr)
    }
    updateSize()

    // Create flowing liquid particles
    const particles: Particle[] = []
    const particleCount = 40
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        radius: 40 + Math.random() * 80,
        baseY: Math.random() * window.innerHeight,
        phase: Math.random() * Math.PI * 2
      })
    }
    particlesRef.current = particles

    const animate = () => {
      timeRef.current += 0.01
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      // Update particles with flowing motion
      particles.forEach((p, i) => {
        p.phase += 0.015
        p.x += Math.sin(timeRef.current + p.phase) * 1.5
        p.y += Math.cos(timeRef.current + p.phase * 0.7) * 1.2

        // Wrap around screen
        if (p.x < -100) p.x = window.innerWidth + 100
        if (p.x > window.innerWidth + 100) p.x = -100
        if (p.y < -100) p.y = window.innerHeight + 100
        if (p.y > window.innerHeight + 100) p.y = -100
      })

      // Draw metaball liquid effect
      const imageData = ctx.createImageData(window.innerWidth, window.innerHeight)
      const data = imageData.data

      for (let x = 0; x < window.innerWidth; x += 3) {
        for (let y = 0; y < window.innerHeight; y += 3) {
          let sum = 0
          
          particles.forEach(p => {
            const dx = x - p.x
            const dy = y - p.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < p.radius * 4) {
              sum += (p.radius * p.radius) / (dist * dist + 1)
            }
          })

          if (sum > 0.6) {
            for (let offsetX = 0; offsetX < 3; offsetX++) {
              for (let offsetY = 0; offsetY < 3; offsetY++) {
                const idx = ((y + offsetY) * window.innerWidth + (x + offsetX)) * 4
                if (idx >= 0 && idx < data.length) {
                  const intensity = Math.min(sum * 60, 255)
                  
                  // Silver metallic with subtle blue tint
                  data[idx] = Math.floor(200 + intensity * 0.2)
                  data[idx + 1] = Math.floor(205 + intensity * 0.2)
                  data[idx + 2] = Math.floor(215 + intensity * 0.25)
                  data[idx + 3] = Math.min(intensity * 1.2, 120)
                }
              }
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0)

      // Add glossy highlights
      particles.forEach(p => {
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 1.5)
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)')
        gradient.addColorStop(0.3, 'rgba(240, 240, 255, 0.15)')
        gradient.addColorStop(1, 'rgba(200, 200, 220, 0)')
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius * 1.5, 0, Math.PI * 2)
        ctx.fill()
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    window.addEventListener('resize', updateSize)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener('resize', updateSize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        filter: 'blur(1px) drop-shadow(0 20px 40px rgba(0,0,0,0.2))',
        mixBlendMode: 'normal',
      }}
    />
  )
}

function IntroSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  })

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.5], [1, 1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9])

  return (
    <motion.div
      ref={ref}
      style={{ opacity, scale }}
      className="sticky top-0 min-h-screen flex items-center justify-center overflow-hidden"
    >
      <LiquidBackground />
      <div className="max-width-wrapper section-padding text-center relative z-10">
        <h2 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-light tracking-tight leading-[0.85] mb-8">
          How It
          <br />
          <span className="italic">Actually</span> Works
        </h2>
        <p className="text-xl sm:text-2xl text-muted-foreground font-light">
          From first conversation to campaign launch
        </p>
      </div>
    </motion.div>
  )
}

export function BrandJourney() {
  return (
    <section className="relative bg-background overflow-hidden">
      {/* Intro Section */}
      <IntroSection />
      
      {/* Story Flow */}
      <div className="relative z-10">
        {journeySteps.map((step, index) => (
          <StorySection key={index} step={step} index={index} />
        ))}
      </div>

      {/* Closing CTA */}
      <div className="min-h-[60vh] flex items-center justify-center py-20">
        <div className="max-width-wrapper section-padding text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h3 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight">
              Let's talk
            </h3>
            <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">
              We'd love to learn about your brand and explore what's possible together.
            </p>
            <motion.a
              href="/brands"
              className="inline-block px-8 py-4 bg-foreground text-background text-sm tracking-wider uppercase hover:bg-foreground/90 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Get in Touch
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
