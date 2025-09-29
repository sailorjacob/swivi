import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="border-t border-black/10 mt-auto relative">
      <div className="max-width-wrapper section-padding py-12 md:py-16">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Logo and tagline */}
          <div>
            <Link href="/" className="inline-flex items-center mb-4">
              <Image
                src="https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs/SwiviLogo.png"
                alt="Swivi"
                width={250}
                height={84}
                className="h-20 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Amplify your brand's reach with our expert media scaling solutions.
            </p>
          </div>

          {/* Copyright */}
          <div className="pt-6 border-t border-black/5 w-full">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Swivi. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Background - positioned within footer */}
      <div className="relative">
        <div
          className="absolute bottom-0 left-0 right-0 z-0 m-0 p-0"
          style={{
            transform: 'translateY(40px)', // Position below footer content
          }}
        >
          <div className="relative w-full h-32 overflow-hidden">
            <Image
              src="https://xaxleljcctobmnwiwxvx.supabase.co/storage/v1/object/public/images/3422.png"
              alt="Swivi Background Branding"
              width={400}
              height={400}
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-auto h-auto max-w-sm object-cover object-bottom"
              style={{
                filter: "brightness(0.9) contrast(1.05)",
              }}
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-background/10 to-transparent" />
          </div>
        </div>
      </div>
    </footer>
  )
} 