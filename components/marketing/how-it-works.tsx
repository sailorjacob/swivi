"use client"

import Script from "next/script"
import { useEffect, useRef, useState } from "react"

const steps = [
  {
    number: "01",
    title: "Send Us Your Content",
    description: "We build a private creator community tailored for your brand. Just send us your content (ideally via Google Drive), and we'll handle everything, including recruiting creators from your audience and our extensive network.",
  },
  {
    number: "02",
    title: "Launch & Coach",
    description: "Once in your community, creators follow our streamlined launch process. We coach them to create high-quality content that matches your brand's vision, guidelines, and platform strategy.",
  },
  {
    number: "03",
    title: "Manage & Scale",
    description: "Our team manages your community daily, engaging creators, answering questions, and keeping momentum strong. Every post is manually reviewed for quality before approval, ensuring only the best content earns payouts. As your top creators thrive, your brand's reach and impact grow.",
  },
]

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const modelContainerRef = useRef<HTMLDivElement>(null)
  const [robotPos, setRobotPos] = useState({ x: 50, y: 50 }) // percentage position
  const targetPosRef = useRef({ x: 50, y: 50 })
  const animationRef = useRef<number>()

  useEffect(() => {
    // Smooth animation loop to move robot towards target
    const animate = () => {
      setRobotPos(prev => {
        const dx = targetPosRef.current.x - prev.x
        const dy = targetPosRef.current.y - prev.y
        // Ease towards target (slow trailing effect)
        const ease = 0.03
        return {
          x: prev.x + dx * ease,
          y: prev.y + dy * ease
        }
      })
      animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!modelContainerRef.current) return
      
      // Calculate mouse position as percentage of viewport
      const xPercent = (e.clientX / window.innerWidth) * 100
      const yPercent = (e.clientY / window.innerHeight) * 100
      
      // Clamp to keep robot visible
      targetPosRef.current = {
        x: Math.max(5, Math.min(95, xPercent)),
        y: Math.max(5, Math.min(95, yPercent))
      }
      
      // Update robot orientation to face mouse
      const modelViewer = modelContainerRef.current.querySelector('model-viewer') as any
      if (!modelViewer) return

      const rect = modelContainerRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const deltaX = e.clientX - centerX
      const deltaY = e.clientY - centerY
      
      // Yaw - horizontal rotation
      const rawYaw = Math.atan2(deltaX, -deltaY) * (180 / Math.PI)
      const maxYaw = 60
      const yaw = Math.max(-maxYaw, Math.min(maxYaw, rawYaw))
      
      // Pitch - vertical tilt
      const maxPitch = 15
      const pitch = Math.max(-maxPitch, Math.min(maxPitch, (deltaY / 400) * maxPitch))
      
      modelViewer.orientation = `0deg ${pitch}deg ${yaw}deg`
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <section ref={sectionRef} id="how-it-works" className="py-20 md:py-32 border-t border-black/5 bg-background relative">
      {/* Load model-viewer library */}
      <Script 
        type="module" 
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />
      
      {/* 3D Robot - Fixed position, follows mouse (Desktop only) */}
      <div 
        ref={modelContainerRef}
        className="hidden md:flex items-center justify-center fixed"
        style={{
          left: `${robotPos.x}vw`,
          top: `${robotPos.y}vh`,
          transform: 'translate(-50%, -50%)',
          width: '200px',
          height: '200px',
          zIndex: 99999,
          pointerEvents: 'none',
          opacity: 1,
          visibility: 'visible',
        }}
      >
        <div 
          style={{
            width: '100%',
            height: '100%',
            opacity: 1,
            visibility: 'visible',
          }}
          dangerouslySetInnerHTML={{
            __html: `
              <model-viewer
                alt="An animated 3D robot"
                src="https://modelviewer.dev/shared-assets/models/RobotExpressive.glb"
                autoplay
                animation-name="Running"
                shadow-intensity="1"
                interaction-prompt="none"
                loading="eager"
                reveal="auto"
                scale="0.2 0.2 0.2"
                camera-orbit="0deg 75deg 5m"
                min-camera-orbit="auto auto 5m"
                max-camera-orbit="auto auto 5m"
                style="width: 100%; height: 100%; background-color: transparent; opacity: 1; visibility: visible; display: block;"
              ></model-viewer>
            `
          }}
        />
      </div>

      <div className="max-width-wrapper section-padding relative z-10">
        <div className="mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            We build and manage your creator community to boost your brand's reach.
          </p>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="space-y-16 max-w-2xl">
            {steps.map((step, index) => (
              <div key={step.number} className="flex gap-8 items-start">
                <div className="flex-shrink-0">
                  <span className="text-3xl font-light text-muted-foreground">
                    {step.number}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-normal text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Layout: Single column */}
        <div className="md:hidden space-y-16">
          {steps.map((step, index) => (
            <div key={step.number} className="flex gap-8 items-start">
              <div className="flex-shrink-0">
                <span className="text-3xl font-light text-muted-foreground">
                  {step.number}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-normal text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Simple CTA */}
        <div className="mt-20 pt-16 border-t border-black/5">
          <p className="text-sm text-muted-foreground mb-6">
            Ready to scale your content reach?
          </p>
          <a
            href="https://calendly.com/bykevingeorge/30min?month=2025-05"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm font-normal border border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background px-6 py-3 rounded-full transition-all duration-300"
          >
            Book a Call →
          </a>
        </div>
      </div>
    </section>
  )
} 