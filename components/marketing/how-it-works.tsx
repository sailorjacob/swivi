"use client"

import Script from "next/script"
import { useEffect, useRef } from "react"

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
  const posRef = useRef({ x: 50, y: 50 })
  const targetPosRef = useRef({ x: 50, y: 50 })
  const currentYawRef = useRef(0)
  const animationRef = useRef<number>()

  useEffect(() => {
    // Direct DOM manipulation animation loop - no React re-renders
    const animate = () => {
      const dx = targetPosRef.current.x - posRef.current.x
      const dy = targetPosRef.current.y - posRef.current.y
      const ease = 0.03
      
      posRef.current.x += dx * ease
      posRef.current.y += dy * ease
      
      // Update position directly on DOM element (percentage of section)
      if (modelContainerRef.current) {
        modelContainerRef.current.style.left = `${posRef.current.x}%`
        modelContainerRef.current.style.top = `${posRef.current.y}%`
        
        // Update yaw based on movement direction
        const movementX = dx
        if (Math.abs(movementX) > 0.1) {
          const targetYaw = movementX > 0 ? 20 : -20
          currentYawRef.current += (targetYaw - currentYawRef.current) * 0.03
        } else {
          // Return to center when not moving
          currentYawRef.current += (0 - currentYawRef.current) * 0.02
        }
        
        const modelViewer = modelContainerRef.current.querySelector('model-viewer') as any
        if (modelViewer) {
          modelViewer.orientation = `0deg ${currentYawRef.current}deg 0deg`
        }
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sectionRef.current) return
      
      const sectionRect = sectionRef.current.getBoundingClientRect()
      
      // Check if mouse is within the section
      const inSection = e.clientY >= sectionRect.top && e.clientY <= sectionRect.bottom
      if (!inSection) return
      
      // Calculate mouse position as percentage within section
      const xPercent = ((e.clientX - sectionRect.left) / sectionRect.width) * 100
      const yPercent = ((e.clientY - sectionRect.top) / sectionRect.height) * 100
      
      // Clamp to keep robot visible within section
      targetPosRef.current = {
        x: Math.max(10, Math.min(90, xPercent)),
        y: Math.max(10, Math.min(90, yPercent))
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <section ref={sectionRef} id="how-it-works" className="py-20 md:py-32 border-t border-black/5 bg-background relative overflow-hidden">
      {/* Load model-viewer library */}
      <Script 
        type="module" 
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />
      
      {/* 3D Robot - Absolute within section, follows mouse (Desktop only) */}
      <div 
        ref={modelContainerRef}
        className="hidden md:block absolute"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '180px',
          height: '180px',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      >
        <div 
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
          }}
          dangerouslySetInnerHTML={{
            __html: `
              <model-viewer
                id="following-model"
                alt="3D Model"
                src="https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/model%205.glb"
                environment-image="https://modelviewer.dev/shared-assets/environments/moon_1k.hdr"
                tone-mapping="agx"
                exposure="1.2"
                shadow-intensity="0"
                loading="eager"
                interaction-prompt="none"
                camera-orbit="0deg 75deg 2m"
                style="width: 100%; height: 100%; background: transparent; --poster-color: transparent; --interaction-prompt-display: none;"
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