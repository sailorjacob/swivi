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

          {/* Simple navigation */}
          <nav className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/how-it-works" className="hover:text-muted-foreground transition-colors">
              How It Works
            </Link>
            <Link href="/success-stories" className="hover:text-muted-foreground transition-colors">
              Success Stories
            </Link>
            <Link href="/contact" className="hover:text-muted-foreground transition-colors">
              Contact Us
            </Link>
            <Link href="/privacy" className="hover:text-muted-foreground transition-colors">
              Privacy
            </Link>
          </nav>

          {/* Contact info */}
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Ready to scale your brand?</p>
            <a href="mailto:hello@swivimedia.com" className="hover:text-foreground transition-colors font-medium">
              hello@swivimedia.com
            </a>
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