"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  User,
  Mail,
  Wallet,
  Link2,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react"
import toast from "react-hot-toast"

// User data will be loaded from session/database
const user = {
  name: "",
  email: "",
  bio: "",
  website: "",
  walletAddress: "",
  paypalEmail: ""
}

// Submissions will be loaded from user's actual data
const submissions: any[] = []

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success("Profile updated successfully!")
    } catch (error) {
      toast.error("Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-500 bg-green-500/10 border-green-500/20'
      case 'pending': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
      case 'rejected': return 'text-red-500 bg-red-500/10 border-red-500/20'
      default: return 'text-muted-foreground bg-muted border-border'
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-light text-foreground">Profile & Settings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <div className="space-y-6">
          {/* Basic Profile */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-white">Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={user.email} />
                    <AvatarFallback className="bg-foreground text-white text-xl">
                      {user.name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Button type="button" variant="outline" className="border-border text-muted-foreground hover:bg-muted">
                    Change Photo
                  </Button>
                </div>

                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    defaultValue={user.name}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user.email}
                    className="mt-1"
                    disabled
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    defaultValue={user.bio}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <div className="relative mt-1">
                    <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      placeholder="https://yourwebsite.com"
                      defaultValue={user.website}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full bg-foreground hover:bg-foreground/90">
                  {isLoading ? "Saving..." : "Save Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Payout Settings */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-white">Payout Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="wallet">USDC Wallet Address</Label>
                <div className="relative mt-1">
                  <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="wallet"
                    placeholder="0x742d35Cc6635C0532925a3b8D951D9C9..."
                    defaultValue={user.walletAddress}
                    className="pl-10 font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your USDC wallet address for crypto payments (Ethereum, Polygon, or BSC)
                </p>
              </div>

              <div>
                <Label htmlFor="paypal">PayPal Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="paypal"
                    type="email"
                    placeholder="yourname@gmail.com"
                    defaultValue={user.paypalEmail}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button className="w-full bg-green-600 hover:bg-green-700">
                Update Payout Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Social Account Connections */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white">Social Account Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-8">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg mb-2">Connect Your Social Accounts</p>
                <p className="text-muted-foreground text-sm mb-4">
                  Connect your social media accounts to verify your content creation capabilities
                </p>
                <Button className="bg-green-600 hover:bg-green-700">
                  Connect Accounts
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}