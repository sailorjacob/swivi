"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DiscordIcon } from "@/components/ui/icons/discord-icon"
import { GoogleIcon } from "@/components/ui/icons/google-icon"
import { SwiviLogo, BackgroundGraphics } from "@/components/ui/icons/swivi-logo"
import { Loader2, ArrowLeft, Zap, Users, TrendingUp, Target, DollarSign, Gift } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { useAuth } from "@/lib/supabase-auth-provider"

export default function BecomeAClipperPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const router = useRouter()
  const { data: session, status } = useSession()
  const { signIn } = useAuth()

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (status === "loading") return

    if (session) {
      console.log("🔄 User already authenticated, redirecting to dashboard")
      router.push("/clippers/dashboard")
    }
  }, [session, status, router])

  const handleSignIn = async (provider: "discord" | "google") => {
    setIsLoading(provider)
    try {
      console.log(`🚀 Starting ${provider} authentication...`)

      const { error } = await signIn(provider)

      if (error) {
        console.error("❌ SignIn error:", error)
        toast.error("Authentication failed. Please try again.")
        setIsLoading(null)
      }
      // Supabase handles the redirect automatically

    } catch (error) {
      console.error("💥 OAuth login error:", error)
      toast.error("An error occurred during sign in. Please try again.")
      setIsLoading(null)
    }
  }

  const benefits = [
    {
      icon: Target,
      title: "Master crafting viral clips",
      description: "Learn proven strategies for creating high-engagement content that drives millions of views."
    },
    {
      icon: DollarSign,
      title: "Earn instant payouts",
      description: "Get paid immediately for approved clips based on views, with no upfront costs or hidden fees."
    },
    {
      icon: Gift,
      title: "Exclusive rewards",
      description: "Unlock special bonuses and premium opportunities for consistent high-quality submissions."
    }
  ]

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <BackgroundGraphics />

      {/* Back to main site - Fixed at top */}
      <div className="absolute top-6 left-6 z-10">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Swivi
        </Link>
      </div>

      {/* Centered login form */}
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-8 lg:gap-12">

          {/* Benefits Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 text-center lg:text-left"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white mb-6">
              Become a <span className="font-normal text-green-400">Top Clipper</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0">
              Join our network of elite content creators and start earning from viral clips today.
            </p>

            <div className="space-y-6 mb-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                  className="flex items-start gap-4 text-left"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center">
                    <benefit.icon className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>Join 1000+ active clippers</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                <span>Average $500+/month earnings</span>
              </div>
            </div>
          </motion.div>

          {/* Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md"
          >
            <Card className="bg-card border border-border backdrop-blur-sm shadow-2xl text-white">
              <CardHeader className="text-center pb-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                  className="mx-auto mb-6 flex items-center justify-center"
                >
                  <SwiviLogo size={56} />
                </motion.div>
                <CardTitle className="text-2xl font-light text-white mb-2">
                  Get Started Now
                </CardTitle>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
                  Join our clipper network and start earning from your content today
                </p>
              </CardHeader>

              <CardContent className="space-y-4 px-8 pb-8 text-white">
                <Button
                  onClick={() => handleSignIn("discord")}
                  disabled={isLoading !== null}
                  className="w-full bg-muted hover:bg-gray-750 text-white border border-gray-600 h-12 transition-all duration-200 group shadow-sm hover:shadow-md"
                >
                  {isLoading === "discord" ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-3" />
                  ) : (
                    <DiscordIcon className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                  )}
                  <span className="font-medium">Continue with Discord</span>
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card text-muted-foreground">or</span>
                  </div>
                </div>

                <Button
                  onClick={() => handleSignIn("google")}
                  disabled={isLoading !== null}
                  variant="outline"
                  className="w-full border-gray-600 text-muted-foreground hover:bg-muted hover:text-white h-12 transition-all duration-200 group hover:shadow-sm"
                >
                  {isLoading === "google" ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-3" />
                  ) : (
                    <GoogleIcon className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                  )}
                  <span className="font-medium">Continue with Google</span>
                </Button>

                <div className="text-center mt-6 pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-2">
                    Already have an account?{" "}
                    <Link href="/clippers/login" className="text-white hover:text-green-300 underline underline-offset-2 transition-colors">
                      Sign in here
                    </Link>
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    By continuing, you agree to our{" "}
                    <Link href="/clippers/dashboard/rules" className="text-foreground hover:text-green-300 underline underline-offset-2 transition-colors">
                      rules and guidelines
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
