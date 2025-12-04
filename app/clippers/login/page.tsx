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
import { SwiviLogo } from "@/components/ui/icons/swivi-logo"
import { Loader2, ArrowLeft, Zap, Users, TrendingUp } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { useAuth } from "@/lib/supabase-auth-provider"

export default function ClippersLoginPage() {
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

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated floating circles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/5"
            style={{
              width: `${300 + i * 100}px`,
              height: `${300 + i * 100}px`,
            }}
            initial={{
              x: `${(i * 25) % 100}%`,
              y: `${(i * 30) % 100}%`,
              scale: 0.5 + (i * 0.1),
            }}
            animate={{
              x: [
                `${(i * 25) % 100}%`,
                `${(i * 25 + 30) % 100}%`,
                `${(i * 25) % 100}%`,
              ],
              y: [
                `${(i * 30) % 100}%`,
                `${(i * 30 + 20) % 100}%`,
                `${(i * 30) % 100}%`,
              ],
            }}
            transition={{
              duration: 15 + i * 5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

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
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
          <Card className="bg-neutral-900 border border-neutral-700 backdrop-blur-sm shadow-2xl">
            <CardHeader className="text-center pb-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto mb-6 flex items-center justify-center"
              >
                <SwiviLogo size={56} />
              </motion.div>
              <CardTitle className="text-2xl font-light text-white mb-2">
                Welcome Back
              </CardTitle>
              <p className="text-neutral-400 text-sm leading-relaxed max-w-sm mx-auto">
                Sign in to access your clipper dashboard and continue earning
              </p>
            </CardHeader>

            <CardContent className="space-y-4 px-8 pb-8">
              <Button
                onClick={() => handleSignIn("discord")}
                disabled={isLoading !== null}
                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600 h-12 transition-all duration-200 group shadow-sm hover:shadow-md"
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
                  <div className="w-full border-t border-neutral-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-neutral-900 text-neutral-500">or</span>
                </div>
              </div>

              <Button
                onClick={() => handleSignIn("google")}
                disabled={isLoading !== null}
                variant="outline"
                className="w-full bg-transparent border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-white h-12 transition-all duration-200 group hover:shadow-sm"
              >
                {isLoading === "google" ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-3" />
                ) : (
                  <GoogleIcon className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                )}
                <span className="font-medium">Continue with Google</span>
              </Button>

              <div className="text-center mt-6 pt-4 border-t border-neutral-700/50">
                <p className="text-sm text-neutral-400 mb-2">
                  Don't have an account?{" "}
                  <Link href="/clippers/signup" className="text-white hover:text-green-300 underline underline-offset-2 transition-colors">
                    Sign up
                  </Link>
                </p>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  By continuing, you agree to our{" "}
                  <Link href="/clippers/rules" className="text-neutral-300 hover:text-white underline underline-offset-2 transition-colors">
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
