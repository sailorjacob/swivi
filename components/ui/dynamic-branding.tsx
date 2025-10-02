"use client"

import { usePathname } from "next/navigation"
import { useMemo } from "react"
import { FloatingBranding } from "./floating-branding"

interface BrandingConfig {
  src: string
  alt: string
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  size?: "sm" | "md" | "lg"
}

const pageBranding: Record<string, BrandingConfig[]> = {
  "/": [
    {
      src: "https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/345.png",
      alt: "Homepage Branding",
      position: "top-left",
      size: "sm"
    },
    {
      src: "https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/342.png",
      alt: "Homepage Branding",
      position: "bottom-right",
      size: "sm"
    }
  ],
  "/about": [
    {
      src: "https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/3422.png",
      alt: "About Page Branding",
      position: "top-right",
      size: "sm"
    },
    {
      src: "https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/233.png",
      alt: "About Page Branding",
      position: "bottom-left",
      size: "sm"
    }
  ],
  "/brands": [
    {
      src: "https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/345.png",
      alt: "Brands Page Branding",
      position: "top-left",
      size: "sm"
    },
    {
      src: "https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/342.png",
      alt: "Brands Page Branding",
      position: "bottom-right",
      size: "sm"
    }
  ],
  "/signup": [
    {
      src: "https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/3422.png",
      alt: "Signup Page Branding",
      position: "top-right",
      size: "sm"
    },
    {
      src: "https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/233.png",
      alt: "Signup Page Branding",
      position: "bottom-left",
      size: "sm"
    }
  ],
  "/case-studies": [
    {
      src: "https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/345.png",
      alt: "Case Studies Branding",
      position: "top-left",
      size: "sm"
    },
    {
      src: "https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/3422.png",
      alt: "Case Studies Branding",
      position: "bottom-right",
      size: "sm"
    }
  ],
  "/community": [
    {
      src: "https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/233.png",
      alt: "Community Branding",
      position: "top-right",
      size: "sm"
    },
    {
      src: "https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/342.png",
      alt: "Community Branding",
      position: "bottom-left",
      size: "sm"
    }
  ],
  "/music-hub": [
    {
      src: "https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/345.png",
      alt: "Music Hub Branding",
      position: "top-left",
      size: "sm"
    },
    {
      src: "https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/3422.png",
      alt: "Music Hub Branding",
      position: "bottom-right",
      size: "sm"
    }
  ]
}

export function DynamicBranding() {
  const pathname = usePathname()

  // Skip branding on clipper platform pages and admin pages to avoid overlap with navigation
  const isClipperPage = pathname.startsWith('/clippers')
  const isAdminPage = pathname.startsWith('/admin')

  const brandingConfigs = useMemo(() => {
    // Skip branding on clipper platform pages and admin pages
    if (isClipperPage || isAdminPage) {
      return null
    }

    // Check for exact matches first
    if (pageBranding[pathname]) {
      return pageBranding[pathname]
    }

    // Check for dynamic routes (like /case-studies/owning-manhattan)
    const pathSegments = pathname.split('/').filter(Boolean)

    if (pathSegments[0] === 'case-studies' && pathSegments.length > 1) {
      return pageBranding['/case-studies'] || []
    }

    // Check for brands sub-pages
    if (pathSegments[0] === 'brands') {
      return pageBranding['/brands'] || []
    }

    // Default to homepage branding
    return pageBranding['/'] || []
  }, [pathname])

  // Skip rendering if no branding configs or if on clipper/admin pages
  if (!brandingConfigs || brandingConfigs.length === 0 || isClipperPage || isAdminPage) {
    return null
  }

  return (
    <>
      {brandingConfigs.map((config, index) => (
        <FloatingBranding
          key={`${pathname}-${index}`}
          src={config.src}
          alt={config.alt}
          position={config.position}
          size={config.size}
          randomPosition={false}
          randomDelay={false}
          animate={true}
        />
      ))}
    </>
  )
}
