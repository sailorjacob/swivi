import Image from "next/image"

interface SwiviLogoProps {
  className?: string
  size?: number
}

export function SwiviLogo({ className = "", size = 40 }: SwiviLogoProps) {
  return (
    <div className={`relative ${className}`}>
      <Image
        src="https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/SwiviLogo.png"
        alt="Swivi Logo"
        width={size}
        height={size}
        className="object-contain"
        priority
      />
    </div>
  )
}
