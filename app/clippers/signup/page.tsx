"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/supabase-auth-provider"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DiscordIcon } from "@/components/ui/icons/discord-icon"
import { GoogleIcon } from "@/components/ui/icons/google-icon"
import { SwiviLogo, BackgroundGraphics } from "@/components/ui/icons/swivi-logo"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { motion } from "framer-motion"

export default function SignupPage() {
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

  const handleOAuthSignup = async (provider: "discord" | "google") => {
    setIsLoading(provider)
    try {
      console.log(`🚀 Starting ${provider} signup...`)

      const { error } = await signIn(provider)

      if (error) {
        console.error("💥 OAuth signup error:", error)
        toast.error("An error occurred during signup. Please try again.")
        setIsLoading(null)
      }
      // Supabase handles the redirect automatically

    } catch (error) {
      console.error("💥 OAuth signup error:", error)
      toast.error("An error occurred during signup. Please try again.")
      setIsLoading(null)
    }
  }

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

      {/* Centered signup form */}
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
                Join Swivi Clippers
              </CardTitle>
              <p className="text-neutral-400 text-sm">
                Connect your account to start earning from viral clips
              </p>
            </CardHeader>

            <CardContent className="space-y-4 px-8 pb-8">
              {/* OAuth Options First */}
              <Button
                onClick={() => handleOAuthSignup("discord")}
                disabled={isLoading !== null}
                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600 h-12"
              >
                {isLoading === "discord" ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-3" />
                ) : (
                  <DiscordIcon className="w-5 h-5 mr-3" />
                )}
                <span className="font-medium">Continue with Discord</span>
              </Button>

              <Button
                onClick={() => handleOAuthSignup("google")}
                disabled={isLoading !== null}
                variant="outline"
                className="w-full bg-transparent border-neutral-600 text-neutral-300 hover:bg-neutral-800 hover:text-white h-12"
              >
                {isLoading === "google" ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-3" />
                ) : (
                  <GoogleIcon className="w-5 h-5 mr-3" />
                )}
                <span className="font-medium">Continue with Google</span>
              </Button>


              <div className="text-center pt-4 border-t border-neutral-700/50">
                <p className="text-sm text-neutral-400">
                  Already have an account?{" "}
                  <Link href="/clippers/login" className="text-white hover:text-green-300 underline underline-offset-2 transition-colors">
                    Sign in
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
