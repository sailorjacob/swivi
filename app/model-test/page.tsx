"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

export default function ModelTestPage() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x191919) // Dark background to see model clearly

    // Camera
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.set(0, 0.5, 2)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(600, 600)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.5
    containerRef.current.appendChild(renderer.domElement)

    // Lighting - comprehensive setup like three-gltf-viewer
    const ambientLight = new THREE.AmbientLight(0xffffff, 1)
    scene.add(ambientLight)

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 2)
    directionalLight1.position.set(5, 10, 7.5)
    scene.add(directionalLight1)

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight2.position.set(-5, 5, -5)
    scene.add(directionalLight2)

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1)
    hemiLight.position.set(0, 20, 0)
    scene.add(hemiLight)

    // Load model
    const loader = new GLTFLoader()
    let model: THREE.Group | null = null

    loader.load(
      'https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/model%205.glb',
      (gltf: { scene: THREE.Group }) => {
        model = gltf.scene
        
        // Debug: log what materials we find
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            console.log('Mesh found:', mesh.name)
            console.log('Material:', mesh.material)
            
            // If material is MeshStandardMaterial, check its properties
            if ((mesh.material as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
              const mat = mesh.material as THREE.MeshStandardMaterial
              console.log('  - Color:', mat.color)
              console.log('  - Map:', mat.map)
              console.log('  - Metalness:', mat.metalness)
              console.log('  - Roughness:', mat.roughness)
            }
          }
        })
        
        // Center and scale
        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 1.2 / maxDim
        
        model.scale.setScalar(scale)
        model.position.sub(center.multiplyScalar(scale))
        
        scene.add(model)
        console.log('Model loaded successfully!')
      },
      (progress) => {
        console.log('Loading:', (progress.loaded / progress.total * 100).toFixed(1) + '%')
      },
      (error: unknown) => {
        console.error('Error loading model:', error)
      }
    )

    // Animation loop
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      if (model) {
        model.rotation.y += 0.01
      }
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      renderer.dispose()
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#111', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
    }}>
      <h1 style={{ color: 'white', marginBottom: '20px', fontFamily: 'system-ui' }}>
        3D Model Test Page
      </h1>
      <p style={{ color: '#888', marginBottom: '20px', fontFamily: 'system-ui' }}>
        Check browser console for material debug info
      </p>
      <div 
        ref={containerRef} 
        style={{ 
          border: '2px solid #333',
          borderRadius: '8px',
          overflow: 'hidden'
        }} 
      />
    </div>
  )
}

