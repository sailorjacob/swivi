import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"
import { Toaster } from "react-hot-toast"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { AuthProvider } from "@/components/providers/auth-provider"
import { ClickAnimation } from "@/components/ui/click-animation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL('https://swivi.com'),
  title: "Swivi - Media Clipping & Brand Scaling Platform",
  description: "Track your brand presence, analyze media mentions, and scale your content reach with Swivi's comprehensive media clipping platform.",
  keywords: "media clipping, brand monitoring, content scaling, media analytics, brand tracking",
  authors: [{ name: "Swivi Team" }],
  openGraph: {
    title: "Swivi - Media Clipping & Brand Scaling Platform",
    description: "Track your brand presence, analyze media mentions, and scale your content reach.",
    url: "https://swivi.com",
    siteName: "Swivi",
    images: [
      {
        url: "https://swivi.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Swivi Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Swivi - Media Clipping & Brand Scaling Platform",
    description: "Track your brand presence, analyze media mentions, and scale your content reach.",
    images: ["https://swivi.com/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <QueryProvider>
              <ClickAnimation />
              {children}
              <Toaster
                position="bottom-right"
                toastOptions={{
                  duration: 5000,
                  style: {
                    background: "hsl(var(--background))",
                    color: "hsl(var(--foreground))",
                    border: "1px solid hsl(var(--border))",
                  },
                }}
              />
            </QueryProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
} 