import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="border-t border-black/10 mt-auto">
      <div className="max-width-wrapper section-padding py-12 md:py-16">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Logo and tagline */}
          <div>
            <Link href="/" className="inline-flex items-center mb-4">
              <Image
                src="https://twejikjgxkzmphocbvpt.supabase.co/storage/v1/object/public/havensvgs//swivi%20logo.png"
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
    </footer>
  )
} 