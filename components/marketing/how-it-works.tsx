"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

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
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: 50, y: 50 })
  const targetPosRef = useRef({ x: 50, y: 50 })
  const modelRef = useRef<THREE.Group | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

  useEffect(() => {
    if (!canvasContainerRef.current) return
    
    // Setup Three.js scene
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.set(0, 0.3, 1.5)
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    })
    renderer.setSize(200, 200)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.5
    rendererRef.current = renderer
    canvasContainerRef.current.appendChild(renderer.domElement)
    
    // Lighting - matching test page that works
    const ambientLight = new THREE.AmbientLight(0xffffff, 1)
    scene.add(ambientLight)
    
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 2)
    directionalLight1.position.set(5, 10, 7.5)
    scene.add(directionalLight1)
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight2.position.set(-5, 5, -5)
    scene.add(directionalLight2)
    
    // Hemisphere light for better ambient
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1)
    hemiLight.position.set(0, 20, 0)
    scene.add(hemiLight)
    
    // Load the model
    const loader = new GLTFLoader()
    loader.load(
      'https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/model%205.glb',
      (gltf: { scene: THREE.Group }) => {
        const model = gltf.scene
        
        // Center and scale the model
        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 0.8 / maxDim
        
        model.scale.setScalar(scale)
        model.position.sub(center.multiplyScalar(scale))
        
        scene.add(model)
        modelRef.current = model
      },
      undefined,
      (error: unknown) => console.error('Error loading model:', error)
    )
    
    // Animation loop
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      
      // Smooth position interpolation
      const dx = targetPosRef.current.x - posRef.current.x
      const dy = targetPosRef.current.y - posRef.current.y
      posRef.current.x += dx * 0.03
      posRef.current.y += dy * 0.03
      
      // Update container position
      if (canvasContainerRef.current) {
        canvasContainerRef.current.style.left = `${posRef.current.x}%`
        canvasContainerRef.current.style.top = `${posRef.current.y}%`
      }
      
      // Rotate model based on movement
      if (modelRef.current) {
        const targetRotation = dx > 0.1 ? 0.3 : dx < -0.1 ? -0.3 : 0
        modelRef.current.rotation.y += (targetRotation - modelRef.current.rotation.y) * 0.05
        modelRef.current.rotation.y += 0.005 // Slow auto-rotate
      }
      
      renderer.render(scene, camera)
    }
    animate()
    
    return () => {
      cancelAnimationFrame(animationId)
      renderer.dispose()
      if (canvasContainerRef.current && renderer.domElement) {
        canvasContainerRef.current.removeChild(renderer.domElement)
      }
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
      
      // Clamp to keep model visible within section
      targetPosRef.current = {
        x: Math.max(15, Math.min(85, xPercent)),
        y: Math.max(15, Math.min(85, yPercent))
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <section ref={sectionRef} id="how-it-works" className="py-20 md:py-32 border-t border-black/5 bg-background relative overflow-hidden">
      {/* 3D Model with Three.js - follows mouse (Desktop only) */}
      <div 
        ref={canvasContainerRef}
        className="hidden md:block absolute"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '200px',
          height: '200px',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      />

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