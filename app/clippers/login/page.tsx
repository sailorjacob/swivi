"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
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
      const result = await signIn(provider, {
        callbackUrl: "/clippers/dashboard",
        redirect: false,
      })

      if (result?.error) {
        toast.error("Authentication failed. Please try again.")
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch (error) {
      toast.error("An error occurred during sign in.")
    } finally {
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
            className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors"
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
          <Card className="bg-neutral-900 border border-gray-700 backdrop-blur-sm shadow-2xl text-white">
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
                Welcome to Swivi Clippers
              </CardTitle>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
                Join an exclusive community of content creators earning competitive payouts for viral clips
              </p>
            </CardHeader>

            <CardContent className="space-y-4 px-8 pb-8 text-white">
              <Button
                onClick={() => handleSignIn("discord")}
                disabled={isLoading !== null}
                className="w-full bg-gray-800 hover:bg-gray-750 text-white border border-gray-600 h-12 transition-all duration-200 group shadow-sm hover:shadow-md"
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
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-neutral-900 text-gray-400">or</span>
                </div>
              </div>

              <Button
                onClick={() => handleSignIn("google")}
                disabled={isLoading !== null}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white h-12 transition-all duration-200 group hover:shadow-sm"
              >
                {isLoading === "google" ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-3" />
                ) : (
                  <GoogleIcon className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                )}
                <span className="font-medium">Continue with Google</span>
              </Button>

              <div className="text-center mt-6 pt-4 border-t border-gray-700/50">
                <p className="text-xs text-gray-500 leading-relaxed">
                  By continuing, you agree to our{" "}
                  <Link href="/clippers/rules" className="text-green-400 hover:text-green-300 underline underline-offset-2 transition-colors">
                    rules and guidelines
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="group text-center p-4 bg-neutral-900 rounded-lg border border-gray-700 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-white/5">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-white/20 transition-colors">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="text-white text-xl font-bold mb-1">$20-100+</div>
            <div className="text-gray-400 text-sm">Per approved clip</div>
          </div>

          <div className="group text-center p-4 bg-neutral-900 rounded-lg border border-gray-700 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-white/5">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-white/20 transition-colors">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="text-white text-xl font-bold mb-1">87+</div>
            <div className="text-gray-400 text-sm">Active Clippers</div>
          </div>

          <div className="group text-center p-4 bg-neutral-900 rounded-lg border border-gray-700 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-white/5">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-white/20 transition-colors">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="text-white text-xl font-bold mb-1">2.3K</div>
            <div className="text-gray-400 text-sm">Clips this month</div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
