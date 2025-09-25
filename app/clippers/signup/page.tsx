"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DiscordIcon } from "@/components/ui/icons/discord-icon"
import { GoogleIcon } from "@/components/ui/icons/google-icon"
import { SwiviLogo } from "@/components/ui/icons/swivi-logo"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { motion } from "framer-motion"

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleOAuthSignup = async (provider: string) => {
    setIsLoading(provider)
    try {
      console.log(`🚀 Starting ${provider} signup...`)
      
      // Use redirect: true for more reliable authentication flow
      const result = await signIn(provider, {
        callbackUrl: "/clippers/dashboard",
        redirect: true,
      })
      
      // This code should not execute since redirect: true will navigate away
      console.log("📊 SignUp result (unexpected):", result)
      
    } catch (error) {
      console.error("💥 OAuth signup error:", error)
      toast.error("An error occurred during signup. Please try again.")
      setIsLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <div className="w-full max-w-md">
        {/* Back to main site */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Swivi
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-card border border-border backdrop-blur-sm shadow-2xl">
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
              <p className="text-muted-foreground text-sm">
                Connect your account to start earning from viral clips
              </p>
            </CardHeader>

            <CardContent className="space-y-4 px-8 pb-8">
              {/* OAuth Options First */}
              <Button
                onClick={() => handleOAuthSignup("discord")}
                disabled={isLoading !== null}
                className="w-full bg-muted hover:bg-gray-750 text-white border border-gray-600 h-12"
              >
                {isLoading === "discord" ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-3" />
                ) : (
                  <DiscordIcon className="w-5 h-5 mr-3" />
                )}
                <span className="font-medium">Continue with Discord</span>
              </Button>

              {/* Google OAuth temporarily disabled until app verification
              <Button
                onClick={() => handleOAuthSignup("google")}
                disabled={isLoading !== null}
                variant="outline"
                className="w-full border-gray-600 text-muted-foreground hover:bg-muted hover:text-white h-12"
              >
                {isLoading === "google" ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-3" />
                ) : (
                  <GoogleIcon className="w-5 h-5 mr-3" />
                )}
                <span className="font-medium">Continue with Google</span>
              </Button>
              */}


              <div className="text-center pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
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
  )
}
