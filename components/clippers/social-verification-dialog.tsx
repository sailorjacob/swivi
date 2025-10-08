"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase-auth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Copy, ExternalLink, AlertCircle, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

interface VerificationDialogProps {
  platform: string
  icon: React.ReactNode
  platformName: string
  children: React.ReactNode
}

export function SocialVerificationDialog({ platform, icon, platformName, children }: VerificationDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [code, setCode] = useState("")
  const [username, setUsername] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setStep(1)
      setCode("")
      setUsername("")
      setDisplayName("")
      setIsGenerating(false)
      setIsVerifying(false)
    }
  }, [open])

  const handleGenerateCode = async (regenerate: boolean = false) => {
    if (!username.trim()) {
      toast.error('Please enter your username first')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/social-verification/generate', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          username: username.trim(),
          displayName: displayName.trim() || platformName,
          force: regenerate
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setCode(data.code)
        setStep(2)
        if (regenerate) {
          toast.success(`New verification code generated for ${platformName}`)
        } else if (data.existing) {
          toast.success(`Using existing verification code for ${platformName}`)
        } else {
          toast.success(`Verification code generated for ${platformName}`)
        }
      } else {
        toast.error(data.error || 'Failed to generate verification code')
        if (data.error?.includes('up to 5')) {
          setStep(1) // Reset to allow trying a different username
        }
      }
    } catch (error) {
      console.error('Error generating code:', error)
      toast.error('Failed to generate verification code')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleVerifyAccount = async () => {
    if (!username.trim()) {
      toast.error('Please enter your username')
      return
    }

    setIsVerifying(true)
    try {
      const response = await fetch('/api/social-verification/verify-browserql', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          username: username.trim(),
          code: code.trim()
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        setStep(3)
        // Refresh the page to show verified status
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        // Enhanced error handling with specific messages
        if (data.error?.includes('not found in bio')) {
          toast.error(`Code not found in your ${platformName} bio. Make sure you've added the code exactly as shown and your profile is public.`)
        } else if (data.error?.includes('No pending verification')) {
          toast.error('No verification code found. Please generate a new code.')
          setStep(1)
        } else if (data.error?.includes('private')) {
          toast.error(`Your ${platformName} profile appears to be private. Please make it public to verify.`)
        } else if (data.error?.includes('not found') || data.error?.includes('not exist')) {
          toast.error(`${platformName} profile not found. Please check your username.`)
        } else {
          toast.error(data.error || `Verification failed. Try generating a new code.`)
        }
      }
    } catch (error) {
      console.error('Error verifying account:', error)
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('504') || error.message.includes('timeout')) {
          toast.error('Verification timed out. Social media sites may be blocking automated access. Please try again later.')
        } else if (error.message.includes('listener indicated an asynchronous response')) {
          toast.error('Browser extension interference detected. Please disable extensions and try again.')
        } else {
          toast.error('Failed to verify account. Please try again.')
        }
      } else {
        toast.error('Failed to verify account. Please try again.')
      }
    } finally {
      setIsVerifying(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Code copied to clipboard!')
  }

  const getPlatformInstructions = () => {
    switch (platform) {
      case 'instagram':
        return {
          step1: "Go to your Instagram profile",
          step2: "Tap 'Edit profile'",
          step3: "Add the verification code to your bio",
          step4: "Tap 'Done' to save"
        }
      case 'youtube':
        return {
          step1: "Go to your YouTube channel",
          step2: "Click on 'Customize channel'",
          step3: "Add the verification code to your channel description",
          step4: "Click 'Publish' to save"
        }
      case 'tiktok':
        return {
          step1: "Go to your TikTok profile",
          step2: "Tap the 'Edit profile' button",
          step3: "Add the verification code to your bio",
          step4: "Tap 'Save' to confirm"
        }
      case 'twitter':
        return {
          step1: "Go to your X (Twitter) profile",
          step2: "Click 'Edit profile'",
          step3: "Add the verification code to your bio",
          step4: "Click 'Save' to confirm"
        }
      default:
        return {
          step1: "Go to your profile",
          step2: "Edit your profile information",
          step3: "Add the verification code to your bio/description",
          step4: "Save your changes"
        }
    }
  }

  const instructions = getPlatformInstructions()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon}
            Verify {platformName} Account
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <Card className="bg-muted/20 border-border">
              <CardContent className="p-4">
                <h3 className="font-medium text-foreground mb-2">How verification works:</h3>
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. Enter your {platformName} username</li>
                  <li>2. We'll generate a unique verification code</li>
                  <li>3. Add this code to your {platformName} bio/description</li>
                  <li>4. We'll verify the code exists on your profile</li>
                  <li>5. Your account will be marked as verified</li>
                </ol>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div>
                <Label htmlFor="username" className="text-foreground">
                  Your {platformName} username (without @)
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={`Enter your ${platformName} username`}
                  className="mt-1 bg-muted border-border text-foreground"
                />
              </div>

              <div>
                <Label htmlFor="displayName" className="text-foreground text-sm">
                  Account name (optional)
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={`e.g., Main, Personal, Business`}
                  className="mt-1 bg-muted border-border text-foreground"
                />
              </div>

              <Button
                onClick={() => handleGenerateCode()}
                disabled={isGenerating || !username.trim()}
                className="w-full bg-foreground hover:bg-foreground/90"
              >
                {isGenerating ? "Generating..." : "Generate Verification Code"}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && code && (
          <div className="space-y-4">
            <Card className="bg-muted/20 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-green-500">Verification code generated!</span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <code className="bg-muted/50 px-3 py-1 rounded text-lg font-mono text-foreground">
                    {code}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(code)}
                    className="border-border/50 text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  This code expires in 24 hours
                </p>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Add code to your {platformName} profile:</h4>

              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-muted-foreground">1.</span>
                  <span>{instructions.step1}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground">2.</span>
                  <span>{instructions.step2}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground">3.</span>
                  <span>{instructions.step3}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground">4.</span>
                  <span>{instructions.step4}</span>
                </div>
              </div>

              <div className="bg-muted/30 border border-border/50 rounded p-3 text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">Important:</span>
                </div>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• Make sure your profile is public (not private)</li>
                  <li>• Add the code exactly as shown above</li>
                  <li>• Save your changes before clicking verify</li>
                  <li>• Verification can take up to 60 seconds</li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">
                    Verification may take up to 60 seconds
                  </p>
                </div>
                <Button
                  onClick={handleVerifyAccount}
                  disabled={isVerifying}
                  className="w-full bg-foreground hover:bg-foreground/90"
                >
                  {isVerifying ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying... (up to 60s)</span>
                    </div>
                  ) : (
                    "Verify Account"
                  )}
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 border-border text-muted-foreground hover:bg-muted"
                  >
                    Back
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleGenerateCode(true)}
                    disabled={isGenerating}
                    className="flex-1 border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-border"
                  >
                    {isGenerating ? "Generating..." : "New Code"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-medium text-green-500">Account Verified!</h3>
            <p className="text-muted-foreground text-sm">
              Your {platformName} account has been successfully verified.
              You can now remove the verification code from your profile.
            </p>
            <Button
              onClick={() => setOpen(false)}
              className="bg-foreground hover:bg-foreground/90"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
