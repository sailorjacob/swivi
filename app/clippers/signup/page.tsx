"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DiscordIcon } from "@/components/ui/icons/discord-icon"
import { GoogleIcon } from "@/components/ui/icons/google-icon"
import { SwiviLogo } from "@/components/ui/icons/swivi-logo"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { motion } from "framer-motion"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading("email")

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Signup failed")
      }

      // Auto login after signup
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        throw new Error("Login failed after signup")
      }

      toast.success("Account created successfully!")
      router.push("/clippers/onboarding")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(null)
    }
  }

  const handleOAuthSignup = async (provider: string) => {
    setIsLoading(provider)
    try {
      await signIn(provider, {
        callbackUrl: "/clippers/onboarding",
      })
    } catch (error) {
      toast.error("An error occurred during signup.")
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
                Start earning from your creative content
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

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">or</span>
                </div>
              </div>

              {/* Email Signup Form */}
              <form onSubmit={handleEmailSignup} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-white">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="mt-1"
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Must be at least 8 characters
                  </p>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700" 
                  disabled={isLoading !== null}
                >
                  {isLoading === "email" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

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
