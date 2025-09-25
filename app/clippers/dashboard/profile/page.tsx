"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
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
  Link2,
  Loader2,
  Youtube,
  Instagram,
  Music,
  Plus,
  ArrowRight
} from "lucide-react"
import toast from "react-hot-toast"
import Link from "next/link"

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  bio: string | null
  website: string | null
  walletAddress: string | null
  paypalEmail: string | null
  image: string | null
  verified: boolean
  totalEarnings: number
  totalViews: number
  createdAt: string
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form data
  const [profileData, setProfileData] = useState({
    name: "",
    bio: "",
    website: ""
  })

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user?.id) return
      
      try {
        const response = await fetch("/api/user/profile")
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          setProfileData({
            name: userData.name || "",
            bio: userData.bio || "",
            website: userData.website || ""
          })
        }
      } catch (error) {
        console.error("Error loading profile:", error)
        toast.error("Failed to load profile")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [session])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.id) return
    
    setIsSaving(true)
    
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "profile",
          ...profileData
        })
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUser(prev => prev ? { ...prev, ...updatedUser } : null)
        toast.success("Profile updated successfully!")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }


  if (isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-light text-foreground">Profile & Settings</h1>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
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
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-16 h-16">
                    <AvatarImage 
                      src={user?.image || session?.user?.image || ""} 
                      alt={user?.name || "Profile"}
                    />
                    <AvatarFallback className="bg-foreground text-white text-xl">
                      {user?.name?.[0] || session?.user?.name?.[0] || user?.email?.[0] || session?.user?.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Profile Photo</span>
                    <span className="text-xs text-muted-foreground">
                      {session?.user?.image ? "From your connected account" : "Default avatar"}
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email (from Discord)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={session?.user?.email || ""}
                    className="mt-1"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email from your Discord account cannot be changed
                  </p>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    className="mt-1"
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {profileData.bio.length}/500 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <div className="relative mt-1">
                    <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      placeholder="https://yourwebsite.com"
                      value={profileData.website}
                      onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isSaving} className="w-full">
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Profile"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Social Media Connections */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Link2 className="w-5 h-5" />
                  Social Media Accounts
                </CardTitle>
                <Link href="/clippers/dashboard/social-accounts">
                  <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:bg-muted">
                    Manage All
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm mb-6">
                Connect your social media accounts to participate in campaigns.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* YouTube */}
                <div className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                        <Youtube className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">YouTube</h3>
                        <p className="text-xs text-muted-foreground">Not connected</p>
                      </div>
                    </div>
                  </div>
                  <Link href="/clippers/dashboard/social-accounts">
                    <Button variant="outline" size="sm" className="w-full border-border text-muted-foreground hover:bg-muted">
                      <Plus className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  </Link>
                </div>

                {/* Instagram */}
                <div className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Instagram className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">Instagram</h3>
                        <p className="text-xs text-muted-foreground">Not connected</p>
                      </div>
                    </div>
                  </div>
                  <Link href="/clippers/dashboard/social-accounts">
                    <Button variant="outline" size="sm" className="w-full border-border text-muted-foreground hover:bg-muted">
                      <Plus className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  </Link>
                </div>

                {/* TikTok */}
                <div className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center border border-white">
                        <Music className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">TikTok</h3>
                        <p className="text-xs text-muted-foreground">Not connected</p>
                      </div>
                    </div>
                  </div>
                  <Link href="/clippers/dashboard/social-accounts">
                    <Button variant="outline" size="sm" className="w-full border-border text-muted-foreground hover:bg-muted">
                      <Plus className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-muted/20 rounded-lg border border-border">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">i</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white mb-1">Why connect accounts?</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Automatically track your clip performance</li>
                      <li>• Participate in platform-specific campaigns</li>
                      <li>• Get faster payment processing</li>
                      <li>• Access advanced analytics</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Account Statistics */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white">Account Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-border">
                <span className="text-muted-foreground">Total Earnings</span>
                <span className="text-white font-medium">${user?.totalEarnings?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border">
                <span className="text-muted-foreground">Total Views</span>
                <span className="text-white font-medium">{user?.totalViews?.toLocaleString() || "0"}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground">Member Since</span>
                <span className="text-white font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}