"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Label } from "../../../../components/ui/label"
import { Textarea } from "../../../../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select"
import { Badge } from "../../../../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../../../components/ui/avatar"
import {
  User,
  Link2,
  Loader2,
  Youtube,
  Instagram,
  Music,
  CheckCircle,
  Trash2,
  MessageCircle
} from "lucide-react"
import toast from "react-hot-toast"
import { SocialVerificationDialog } from "../../../../components/clippers/social-verification-dialog"

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
  updatedAt?: string
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([])

  // Form data
  const [profileData, setProfileData] = useState({
    name: "",
    bio: "",
    website: ""
  })

  // Load user profile data and verified accounts
  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user?.id) return

      try {
        // Load profile data
        const profileResponse = await fetch("/api/user/profile")
        if (profileResponse.ok) {
          const userData = await profileResponse.json()
          setUser(userData)
          setProfileData({
            name: (userData.name && userData.name !== ";Updated name;" && userData.name.trim() !== "") ? userData.name : (session?.user?.name || ""),
            bio: userData.bio || "",
            website: userData.website || ""
          })
        } else if (profileResponse.status === 401) {
          toast.error("Please log in to view your profile")
          return
        } else if (profileResponse.status === 404) {
          toast.error("Profile not found. Please contact support.")
          return
        } else {
          const errorData = await profileResponse.json().catch(() => ({}))
          toast.error(errorData.error || "Failed to load profile data")
          return
        }

        // Load all connected accounts (OAuth + verified social)
        const accountsResponse = await fetch("/api/user/connected-accounts")
        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json()
          setConnectedAccounts(accountsData)
        } else if (accountsResponse.status === 401) {
          toast.error("Please log in to view connected accounts")
        } else if (accountsResponse.status >= 500) {
          toast.error("Server error loading accounts. Please try again.")
        } else {
          console.warn("Failed to load connected accounts:", accountsResponse.status)
          // Don't show error toast for accounts failing, it's not critical
        }
      } catch (error) {
        console.error("Error loading profile:", error)
        if (error instanceof TypeError && error.message.includes('fetch')) {
          toast.error("Network error. Please check your internet connection.")
        } else {
          toast.error("Failed to load profile. Please try refreshing the page.")
        }
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
          name: profileData.name,
          bio: profileData.bio,
          website: profileData.website
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

  const handleDeleteAccount = async (accountId: string, canDelete: boolean, accountInfo?: any) => {
    if (!canDelete) {
      toast.error("This account cannot be removed")
      return
    }
    
    const confirmMessage = accountInfo 
      ? `Are you sure you want to delete @${accountInfo.username} (${accountInfo.platform})? This will remove the verified account and you'll need to verify again to reconnect it.`
      : "Are you sure you want to delete this verified account?"
      
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const response = await fetch(`/api/user/connected-accounts?id=${accountId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Account deleted successfully")
        // Refresh the connected accounts list
        const accountsResponse = await fetch("/api/user/connected-accounts")
        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json()
          setConnectedAccounts(accountsData)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete account")
      }
    } catch (error) {
      console.error("Error deleting account:", error)
      toast.error("Failed to delete account")
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
              <CardTitle className="text-foreground">Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-16 h-16">
                    <AvatarImage
                      src={user?.image || session?.user?.image || ""}
                      alt={(() => {
                        const displayName = (user?.name && user.name !== ";Updated name;" && user.name.trim() !== "")
                          ? user.name
                          : (session?.user?.name || "Profile")
                        return displayName
                      })()}
                    />
                    <AvatarFallback className="bg-foreground text-white text-xl">
                      {(() => {
                        const displayName = (user?.name && user.name !== ";Updated name;" && user.name.trim() !== "")
                          ? user.name
                          : (session?.user?.name || user?.email || session?.user?.email || "U")
                        return displayName[0]?.toUpperCase() || "U"
                      })()}
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
              <CardTitle className="text-foreground flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Connect Social Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Connect your accounts to participate in campaigns
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {/* YouTube */}
                <SocialVerificationDialog
                  platform="youtube"
                  icon={<Youtube className="w-5 h-5 text-red-400" />}
                  platformName="YouTube"
                >
                  <div className="border border-border rounded-lg p-3 hover:bg-muted/30 transition-all duration-200 cursor-pointer hover:border-border/60 group">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                        <Youtube className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-medium text-foreground text-sm hidden sm:block">YouTube</h3>
                        <Button variant="outline" size="sm" className="w-full text-xs border-border text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border/60 mt-1">
                          Verify
                        </Button>
                      </div>
                    </div>
                  </div>
                </SocialVerificationDialog>

                {/* Instagram */}
                <SocialVerificationDialog
                  platform="instagram"
                  icon={<Instagram className="w-5 h-5 text-purple-400" />}
                  platformName="Instagram"
                >
                  <div className="border border-border rounded-lg p-3 hover:bg-muted/30 transition-all duration-200 cursor-pointer hover:border-border/60 group">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500/8 to-pink-500/8 rounded-full flex items-center justify-center group-hover:from-purple-500/12 group-hover:to-pink-500/12 transition-all">
                        <Instagram className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-medium text-foreground text-sm hidden sm:block">Instagram</h3>
                        <Button variant="outline" size="sm" className="w-full text-xs border-border text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border/60 mt-1">
                          Verify
                        </Button>
                      </div>
                    </div>
                  </div>
                </SocialVerificationDialog>

                {/* TikTok */}
                <SocialVerificationDialog
                  platform="tiktok"
                  icon={<Music className="w-5 h-5 text-slate-300" />}
                  platformName="TikTok"
                >
                  <div className="border border-border rounded-lg p-3 hover:bg-muted/30 transition-all duration-200 cursor-pointer hover:border-border/60 group">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 bg-slate-500/10 rounded-full flex items-center justify-center group-hover:bg-slate-500/20 transition-colors">
                        <Music className="w-5 h-5 text-slate-300" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-medium text-foreground text-sm hidden sm:block">TikTok</h3>
                        <Button variant="outline" size="sm" className="w-full text-xs border-border text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border/60 mt-1">
                          Verify
                        </Button>
                      </div>
                    </div>
                  </div>
                </SocialVerificationDialog>

                {/* X (Twitter) */}
                <SocialVerificationDialog
                  platform="twitter"
                  icon={<span className="text-slate-300 font-bold text-lg">𝕏</span>}
                  platformName="X (Twitter)"
                >
                  <div className="border border-border rounded-lg p-3 hover:bg-muted/30 transition-all duration-200 cursor-pointer hover:border-border/60 group">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 bg-slate-500/10 rounded-full flex items-center justify-center group-hover:bg-slate-500/20 transition-colors">
                        <span className="text-slate-300 font-bold text-lg">𝕏</span>
                      </div>
                      <div className="text-center">
                        <h3 className="font-medium text-foreground text-sm hidden sm:block">X (Twitter)</h3>
                        <Button variant="outline" size="sm" className="w-full text-xs border-border text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border/60 mt-1">
                          Verify
                        </Button>
                      </div>
                    </div>
                  </div>
                </SocialVerificationDialog>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Connected Accounts */}
        {connectedAccounts.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-muted-foreground" />
                Connected Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {connectedAccounts.map((account: any) => (
                  <div key={account.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      {account.platform === 'DISCORD' && (
                        <div className="w-8 h-8 bg-muted/30 rounded-full flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      {account.platform === 'INSTAGRAM' && (
                        <div className="w-8 h-8 bg-muted/30 rounded-full flex items-center justify-center">
                          <Instagram className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      {account.platform === 'YOUTUBE' && (
                        <div className="w-8 h-8 bg-muted/30 rounded-full flex items-center justify-center">
                          <Youtube className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      {account.platform === 'TIKTOK' && (
                        <div className="w-8 h-8 bg-muted/30 rounded-full flex items-center justify-center">
                          <Music className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      {account.platform === 'TWITTER' && (
                        <div className="w-8 h-8 bg-muted/30 rounded-full flex items-center justify-center">
                          <span className="text-muted-foreground font-bold text-sm">𝕏</span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-muted-foreground text-sm">
                          {account.platform === 'DISCORD' && 'Discord'}
                          {account.platform === 'INSTAGRAM' && 'Instagram'}
                          {account.platform === 'YOUTUBE' && 'YouTube'}
                          {account.platform === 'TIKTOK' && 'TikTok'}
                          {account.platform === 'TWITTER' && 'X'}
                        </p>
                        <p className="text-xs text-foreground">
                          {account.isOAuth ? account.username : `@${account.username}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <span className="text-green-400">✓</span> {account.isOAuth ? 'Connected' : 'Verified'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {account.canDelete ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAccount(account.id, account.canDelete, account)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Primary</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Statistics */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Account Statistics</CardTitle>
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