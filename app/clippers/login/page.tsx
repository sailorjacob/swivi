"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DiscordIcon } from "@/components/ui/icons/discord-icon"
import { GoogleIcon } from "@/components/ui/icons/google-icon"
import { SwiviLogo } from "@/components/ui/icons/swivi-logo"
import { Loader2, ArrowLeft, Zap, Users, TrendingUp } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

export default function ClippersLoginPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleSignIn = async (provider: string) => {
    setIsLoading(provider)
    try {
      console.log(`🚀 Starting ${provider} authentication...`)
      
      // Use redirect: true for more reliable authentication flow
      const result = await signIn(provider, {
        callbackUrl: "/clippers/dashboard",
        redirect: true,
      })
      
      // This code should not execute since redirect: true will navigate away
      console.log("📊 SignIn result (unexpected):", result)
      
    } catch (error) {
      console.error("💥 OAuth login error:", error)
      toast.error("An error occurred during sign in. Please try again.")
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
          <Card className="bg-card border border-border backdrop-blur-sm shadow-2xl text-white">
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
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
                Sign in to access your clipper dashboard and continue earning
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

                     {/* Google OAuth temporarily disabled until app verification
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
                     */}

              <div className="text-center mt-6 pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground mb-2">
                  Don't have an account?{" "}
                  <Link href="/clippers/signup" className="text-white hover:text-green-300 underline underline-offset-2 transition-colors">
                    Sign up
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
  )
}
