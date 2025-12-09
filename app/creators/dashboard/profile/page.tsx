"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useSession, useAuth } from "@/lib/supabase-auth-provider"
import { useRouter } from "next/navigation"
import { authenticatedFetch } from "@/lib/supabase-browser"
import { supabase } from "@/lib/supabase-browser"
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
  MessageCircle,
  LogOut,
  MessageSquare,
  ChevronRight,
  Bell
} from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { SocialVerificationDialog } from "../../../../components/creators/social-verification-dialog"
import { SupportTicketDialog } from "../../../../components/creators/support-ticket-dialog"
import { ProfileMessagesSection } from "../../../../components/campaigns/campaign-announcement-banner"

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  bio: string | null
  website: string | null
  walletAddress: string | null
  paypalEmail: string | null
  bitcoinAddress: string | null
  image: string | null
  verified: boolean
  totalEarnings: number
  totalViews: number
  createdAt: string
  updatedAt?: string
}

interface SupportTicket {
  id: string
  status: string
  adminResponse: string | null
  createdAt: string
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const { logout } = useAuth()
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([])
  const [isFetchingProfile, setIsFetchingProfile] = useState(false)
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([])
  const [ticketsWithReplies, setTicketsWithReplies] = useState(0)

  const handleSignOut = async () => {
    await logout()
    router.push("/")
  }

  // Form data
  const [profileData, setProfileData] = useState({
    name: "",
    bio: "",
    website: ""
  })

  // Load user profile data and verified accounts
  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user?.id || isFetchingProfile) return

      // Add a small delay to ensure auth state is stable
      setTimeout(async () => {
        if (!session?.user?.id) return // Check again after delay

        try {
          setIsFetchingProfile(true)
          // Load profile data
          const profileResponse = await authenticatedFetch("/api/user/profile")
          if (profileResponse.ok) {
            const userData = await profileResponse.json()
            setUser(userData)

            // Use database data as primary source, simple fallback
            const displayName = userData.name || session?.user?.email?.split('@')[0] || 'User'

            setProfileData({
              name: displayName,
              bio: userData.bio || "",
              website: userData.website || ""
            })

            // Load all connected accounts (OAuth + verified social)
            const accountsResponse = await authenticatedFetch("/api/user/connected-accounts")
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

            // Load support tickets
            const ticketsResponse = await authenticatedFetch("/api/support-tickets")
            if (ticketsResponse.ok) {
              const ticketsData = await ticketsResponse.json()
              setSupportTickets(ticketsData)
              // Count tickets with admin replies
              const withReplies = ticketsData.filter((t: SupportTicket) => t.adminResponse).length
              setTicketsWithReplies(withReplies)
            }
          } else if (profileResponse.status === 401) {
            toast.error("Please log in to view your profile")
          } else if (profileResponse.status === 404) {
            toast.error("Profile not found. Please contact support.")
          } else if (profileResponse.status >= 500) {
            // For server errors, try to show basic profile info from session
            console.log('🔍 Server error loading profile - using session data')
            const fallbackProfile = {
              id: session?.user?.id || '',
              name: session?.user?.name || session?.user?.email?.split('@')[0] || 'User',
              email: session?.user?.email || '',
              bio: null,
              website: null,
              walletAddress: null,
              paypalEmail: null,
              image: session?.user?.image || null,
              verified: session?.user?.verified || false,
              totalEarnings: 0,
              totalViews: 0,
              createdAt: new Date().toISOString()
            }
            setUser(fallbackProfile)
            setProfileData({
              name: fallbackProfile.name,
              bio: "",
              website: ""
            })
            console.log('⚠️ Server error loading profile - using session fallback')
            // Don't show error toast since we have fallback data
          } else {
            const errorData = await profileResponse.json().catch(() => ({}))
            toast.error(errorData.error || "Failed to load profile data")
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
          setIsFetchingProfile(false)
        }
      }, 200) // 200ms delay to ensure auth state is stable
    }

    loadProfile()
  }, [session])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.id) return

    setIsSaving(true)

    try {
      const response = await authenticatedFetch("/api/user/profile", {
        method: "PUT",
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
        
        // Notify navigation to refresh user data
        window.dispatchEvent(new CustomEvent('profileUpdated'))
        console.log('✅ Profile updated - navigation will refresh automatically')
        
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
      const response = await authenticatedFetch(`/api/user/connected-accounts?id=${accountId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Account deleted successfully")
        // Refresh the connected accounts list
        const accountsResponse = await authenticatedFetch("/api/user/connected-accounts")
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
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-foreground bg-foreground/10 border-foreground/20'
      case 'pending': return 'text-muted-foreground bg-muted border-border'
      case 'rejected': return 'text-muted-foreground/70 bg-muted border-border'
      default: return 'text-muted-foreground bg-muted border-border'
    }
  }

  return (
    <div className="space-y-8">
      
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

              <div className="grid grid-cols-3 gap-3">
                {/* YouTube */}
                <SocialVerificationDialog
                  platform="youtube"
                  icon={<Youtube className="w-5 h-5 text-red-400" />}
                  platformName="YouTube"
                >
                  <div className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-all duration-200 cursor-pointer hover:border-border/60 group">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                        <Youtube className="w-5 h-5 text-red-400" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">YouTube</span>
                    </div>
                  </div>
                </SocialVerificationDialog>

                {/* Instagram */}
                <SocialVerificationDialog
                  platform="instagram"
                  icon={<Instagram className="w-5 h-5 text-purple-400" />}
                  platformName="Instagram"
                >
                  <div className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-all duration-200 cursor-pointer hover:border-border/60 group">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                        <Instagram className="w-5 h-5 text-purple-400" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">Instagram</span>
                    </div>
                  </div>
                </SocialVerificationDialog>

                {/* TikTok */}
                <SocialVerificationDialog
                  platform="tiktok"
                  icon={<Music className="w-5 h-5 text-slate-300" />}
                  platformName="TikTok"
                >
                  <div className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-all duration-200 cursor-pointer hover:border-border/60 group">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-slate-500/10 rounded-full flex items-center justify-center group-hover:bg-slate-500/20 transition-colors">
                        <Music className="w-5 h-5 text-slate-300" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">TikTok</span>
                    </div>
                  </div>
                </SocialVerificationDialog>

                {/* X (Twitter) - HIDDEN: Apify actors not working, re-enable when ready */}
                {/* <SocialVerificationDialog
                  platform="twitter"
                  icon={<span className="text-slate-300 font-bold text-lg">𝕏</span>}
                  platformName="X (Twitter)"
                >
                  <div className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-all duration-200 cursor-pointer hover:border-border/60 group">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-slate-500/10 rounded-full flex items-center justify-center group-hover:bg-slate-500/20 transition-colors">
                        <span className="text-slate-300 font-bold text-lg">𝕏</span>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">X</span>
                    </div>
                  </div>
                </SocialVerificationDialog> */}
              </div>
            </CardContent>
          </Card>

        </div>


        {/* Connected Accounts */}
        {connectedAccounts.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-muted-foreground" />
                  Connected Accounts
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {connectedAccounts.filter((a: any) => !a.isOAuth).length} verified
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {connectedAccounts.map((account: any) => (
                  <div key={account.id} className="flex items-center justify-between p-2.5 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {account.platform === 'DISCORD' && (
                        <div className="w-7 h-7 bg-muted/30 rounded-full flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      )}
                      {account.platform === 'INSTAGRAM' && (
                        <div className="w-7 h-7 bg-muted/30 rounded-full flex items-center justify-center flex-shrink-0">
                          <Instagram className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      )}
                      {account.platform === 'YOUTUBE' && (
                        <div className="w-7 h-7 bg-muted/30 rounded-full flex items-center justify-center flex-shrink-0">
                          <Youtube className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      )}
                      {account.platform === 'TIKTOK' && (
                        <div className="w-7 h-7 bg-muted/30 rounded-full flex items-center justify-center flex-shrink-0">
                          <Music className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      )}
                      {account.platform === 'TWITTER' && (
                        <div className="w-7 h-7 bg-muted/30 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-muted-foreground font-bold text-xs">𝕏</span>
                        </div>
                      )}
                      {/* Handle GOOGLE platform for Google OAuth */}
                      {account.platform === 'GOOGLE' && (
                        <div className="w-7 h-7 bg-muted/30 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs text-foreground truncate">
                            {account.isOAuth ? account.username : `@${account.username}`}
                          </p>
                          <span className="text-primary text-xs">✓</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {account.platform === 'DISCORD' && 'Discord'}
                          {account.platform === 'INSTAGRAM' && 'Instagram'}
                          {account.platform === 'YOUTUBE' && 'YouTube'}
                          {account.platform === 'TIKTOK' && 'TikTok'}
                          {account.platform === 'TWITTER' && 'X'}
                          {account.platform === 'GOOGLE' && 'Google'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {account.canDelete ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAccount(account.id, account.canDelete, account)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted/30 rounded">Primary</span>
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
                <span className="text-foreground font-medium">${(typeof user?.totalEarnings === 'number' ? user.totalEarnings : parseFloat(user?.totalEarnings || 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-border">
                <span className="text-muted-foreground">Total Views</span>
                <span className="text-foreground font-medium">{user?.totalViews?.toLocaleString() || "0"}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-muted-foreground">Member Since</span>
                <span className="text-foreground font-medium">
                  {user?.createdAt && !isNaN(new Date(user.createdAt).getTime()) 
                    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Updates & Support */}
        <div className="mt-auto pt-6 space-y-6">
          {/* Team Updates / Messages */}
          <ProfileMessagesSection />

          {/* Support Section */}
          <div className="space-y-3">
            {/* Support Tickets Status */}
            {supportTickets.length > 0 && (
              <Link href="/creators/dashboard/support">
                <div className="p-3 rounded-lg border border-border bg-card/50 hover:bg-card/70 transition-colors cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        {ticketsWithReplies > 0 && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-foreground">
                          {supportTickets.length} {supportTickets.length === 1 ? 'ticket' : 'tickets'}
                          {ticketsWithReplies > 0 && (
                            <span className="text-primary ml-1">
                              • {ticketsWithReplies} {ticketsWithReplies === 1 ? 'reply' : 'replies'}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ticketsWithReplies > 0 ? 'View responses' : 'View your tickets'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </div>
              </Link>
            )}
            
            <SupportTicketDialog>
              <Button
                variant="outline"
                className="w-full text-muted-foreground hover:text-foreground border-border hover:bg-muted"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </SupportTicketDialog>
            
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full text-muted-foreground hover:text-foreground border-border hover:bg-muted"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}