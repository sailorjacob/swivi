import Image from "next/image"

interface BottomBackgroundProps {
  src: string
  alt: string
  className?: string
}

export function BottomBackground({
  src,
  alt,
  className = ""
}: BottomBackgroundProps) {
  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-0 m-0 p-0
        ${className}
      `}
      style={{
        transform: 'translateY(-280px)', // Position in footer area
      }}
    >
      <div className="relative w-full h-32 overflow-hidden">
        {/* Main image that appears at bottom */}
        <Image
          src={src}
          alt={alt}
          width={400}
          height={400}
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-auto h-auto max-w-sm object-cover object-bottom"
          style={{
            filter: "brightness(0.9) contrast(1.05)",
          }}
          unoptimized
        />

        {/* Light gradient overlay to fade into background */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-background/10 to-transparent" />
      </div>
    </div>
  )
}
