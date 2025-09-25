"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Copy, ExternalLink, AlertCircle } from "lucide-react"
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
  const [isGenerating, setIsGenerating] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  const handleGenerateCode = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/social-verification/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform }),
      })

      const data = await response.json()

      if (response.ok) {
        setCode(data.code)
        setStep(2)
        toast.success(`Verification code generated for ${platformName}`)
      } else {
        toast.error(data.error || 'Failed to generate verification code')
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
      const response = await fetch('/api/social-verification/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform, username: username.trim() }),
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
        toast.error(data.error || 'Verification failed')
      }
    } catch (error) {
      console.error('Error verifying account:', error)
      toast.error('Failed to verify account')
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
      <DialogContent className="sm:max-w-md bg-card border-border text-white">
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
                <h3 className="font-medium text-white mb-2">How verification works:</h3>
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. We'll generate a unique verification code</li>
                  <li>2. Add this code to your {platformName} bio/description</li>
                  <li>3. We'll verify the code exists on your profile</li>
                  <li>4. Your account will be marked as verified</li>
                </ol>
              </CardContent>
            </Card>

            <Button
              onClick={handleGenerateCode}
              disabled={isGenerating}
              className="w-full bg-foreground hover:bg-foreground/90"
            >
              {isGenerating ? "Generating..." : "Generate Verification Code"}
            </Button>
          </div>
        )}

        {step === 2 && code && (
          <div className="space-y-4">
            <Card className="bg-green-900/20 border-green-700/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="font-medium text-green-400">Verification code generated!</span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <code className="bg-muted px-3 py-1 rounded text-lg font-mono text-white">
                    {code}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(code)}
                    className="border-border text-muted-foreground hover:bg-muted"
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
              <h4 className="font-medium text-white">Add code to your {platformName} profile:</h4>

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

              <div className="pt-2">
                <Label htmlFor="username" className="text-white text-sm">
                  Your {platformName} username (without @)
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={`Enter your ${platformName} username`}
                  className="mt-1 bg-muted border-border text-white"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 border-border text-muted-foreground hover:bg-muted"
                >
                  Back
                </Button>
                <Button
                  onClick={handleVerifyAccount}
                  disabled={isVerifying || !username.trim()}
                  className="flex-1 bg-foreground hover:bg-foreground/90"
                >
                  {isVerifying ? "Verifying..." : "Verify Account"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium text-green-400">Account Verified!</h3>
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
