"use client"

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "@/lib/supabase-auth-provider"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Search, UserCheck, UserX, Shield, Users, Crown, Eye, RefreshCw, CheckCircle, DollarSign, Wallet, Mail, Clock, AlertCircle, Copy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface SocialAccount {
  id: string
  platform: "TIKTOK" | "YOUTUBE" | "INSTAGRAM" | "TWITTER"
  username: string
  displayName: string | null
  verifiedAt: string | null
  followers: number | null
}

interface PendingPayoutRequest {
  id: string
  amount: number
  status: string
  paymentMethod: string | null
  requestedAt: string
}

interface User {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: "CLIPPER" | "ADMIN"
  createdAt: string
  totalViews: number
  totalEarnings: number
  paypalEmail: string | null
  walletAddress: string | null
  bitcoinAddress: string | null
  _count?: {
    clipSubmissions: number
    payoutRequests: number
  }
  socialAccounts?: SocialAccount[]
  pendingPayoutRequest?: PendingPayoutRequest | null
}

const roleOptions = [
  { value: "all", label: "All Roles" },
  { value: "ADMIN", label: "Admins" },
  { value: "CLIPPER", label: "Clippers" }
]

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const highlightId = searchParams.get('highlight')
  const highlightedRef = useRef<HTMLDivElement>(null)
  const [hasScrolled, setHasScrolled] = useState(false)
  
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [slowLoading, setSlowLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Check authentication status
  useEffect(() => {
    if (status === "loading") return // Still loading

    if (status === "unauthenticated" || !session) {
      console.log("❌ User not authenticated, redirecting to login")
      router.push("/creators/login?error=AccessDenied")
      return
    }

    if (session.user?.role !== "ADMIN") {
      console.log("❌ User is not admin, redirecting to dashboard")
      router.push("/creators/dashboard?error=AdminAccessRequired")
      return
    }

    console.log("✅ User authenticated as admin:", session.user.email)
  }, [session, status, router])

  // Fetch users function
  const fetchUsers = useCallback(async () => {
    // Only fetch if user is authenticated and is admin
    if (status !== "authenticated" || !session || session.user?.role !== "ADMIN") {
      console.log("⏳ Waiting for authentication before fetching users...")
      return
    }

    try {
      setLoading(true)
      setSlowLoading(false)

      // Set slow loading indicator after 3 seconds
      const slowLoadingTimeout = setTimeout(() => {
        setSlowLoading(true)
      }, 3000)

      const params = new URLSearchParams()
      if (selectedRole !== "all") {
        params.append("role", selectedRole)
      }

      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(`/api/admin/users?${params}`, {
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      clearTimeout(slowLoadingTimeout)

      console.log("API Response status:", response.status, response.statusText)

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Users data received:", data)
        console.log("Number of users:", data.users?.length || 0)
        setUsers(data.users || [])
      } else if (response.status === 401) {
        console.error("❌ Authentication error - showing error instead of redirecting")
        toast.error("Authentication failed. Please refresh the page or sign in again.")
        setError("Authentication failed. Please try refreshing the page or signing in again.")
        return
      } else if (response.status === 403) {
        console.error("❌ Admin access denied")
        toast.error("Admin access required")
        window.location.href = "/creators/dashboard?error=AdminAccessRequired"
        return
      } else {
        let errorData
        try {
          errorData = await response.json()
        } catch (parseError) {
          console.error("❌ Failed to parse error response:", parseError)
          errorData = {}
        }
        console.error("❌ API Error:", response.status, errorData)
        toast.error(`Failed to fetch users: ${errorData.error || 'Unknown error'}`)
        setUsers([])
      }
    } catch (error) {
      console.error("❌ Network error fetching users:", error)

      // Type guard for error object
      const err = error as Error & { name?: string; message?: string }

      // Handle different types of errors
      if (err.name === 'AbortError') {
        console.error("❌ Request timeout - API took too long to respond")
        toast.error("Request timeout - please try refreshing")
      } else if (err.message?.includes('fetch')) {
        console.error("❌ Network connectivity issue")
        toast.error("Network error - please check your connection and try again")
      } else {
        console.error("❌ General error:", err.message || 'Unknown error')
        toast.error("Failed to load users - please try refreshing")
      }

      setUsers([])
    } finally {
      setLoading(false)
      setSlowLoading(false)
    }
  }, [status, session, selectedRole])

  // Fetch users when authenticated and role is admin
  useEffect(() => {
    if (status === "authenticated" && session && session.user?.role === "ADMIN") {
      console.log("🚀 User is authenticated as admin, fetching users...")
      fetchUsers()
    }
  }, [status, session, fetchUsers])

  // Scroll to highlighted user when data loads
  useEffect(() => {
    if (highlightId && !loading && users.length > 0 && !hasScrolled) {
      setTimeout(() => {
        if (highlightedRef.current) {
          highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setHasScrolled(true)
        }
      }, 100)
    }
  }, [highlightId, loading, users, hasScrolled])

  // Handle role filter change
  const handleRoleChange = (newRole: string) => {
    console.log("🔄 Role filter changed to:", newRole)
    setSelectedRole(newRole)
    setSearchTerm("") // Clear search when changing role filter
  }

  // Promote user to admin
  const promoteToAdmin = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: "ADMIN" })
      })

      if (response.ok) {
        toast.success("User promoted to admin")
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to promote user")
      }
    } catch (error) {
      console.error("Error promoting user:", error)
      toast.error("Failed to promote user")
    }
  }

  // Demote admin to clipper
  const demoteFromAdmin = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: "CLIPPER" })
      })

      if (response.ok) {
        toast.success("User demoted to clipper")
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to demote user")
      }
    } catch (error) {
      console.error("Error demoting user:", error)
      toast.error("Failed to demote user")
    }
  }

  // Get role badge color
  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-muted border border-border text-foreground"
      case "CLIPPER": return "bg-muted border border-border text-foreground"
      default: return "bg-muted border border-border text-foreground"
    }
  }

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN": return Crown
      case "CLIPPER": return Users
      default: return Users
    }
  }

  // Get social platform icon
  const getSocialPlatformIcon = (platform: string) => {
    switch (platform) {
      case "TIKTOK": return "🎵"
      case "YOUTUBE": return "📺"
      case "INSTAGRAM": return "📷"
      case "TWITTER": return "🐦"
      default: return "🔗"
    }
  }

  // Get social platform name
  const getSocialPlatformName = (platform: string) => {
    switch (platform) {
      case "TIKTOK": return "TikTok"
      case "YOUTUBE": return "YouTube"
      case "INSTAGRAM": return "Instagram"
      case "TWITTER": return "Twitter"
      default: return platform
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Calculate stats - only calculate when users are loaded
  const adminCount = users.filter(u => u.role === "ADMIN").length
  const clipperCount = users.filter(u => u.role === "CLIPPER").length
  const totalCount = users.length


  // Show loading while checking authentication
  if (status === "loading" || (status === "authenticated" && !session)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Checking authentication...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-semibold">{totalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Crown className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Admins</p>
                  <p className="text-2xl font-semibold">{adminCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Clippers</p>
                  <p className="text-2xl font-semibold">{clipperCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="min-w-[150px]">
                <Select value={selectedRole} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchUsers}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-muted-foreground">
                  {slowLoading ? "Still loading users... This might take a moment." : "Loading users..."}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchUsers}
                    disabled={loading}
                  >
                    Retry
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                  >
                    Refresh Page
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => {
                const RoleIcon = getRoleIcon(user.role)
                const isHighlighted = highlightId === user.id
                return (
                  <div
                    key={user.id}
                    ref={isHighlighted ? highlightedRef : undefined}
                    className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-all duration-500 ${
                      isHighlighted ? 'bg-muted/80 border-foreground/20' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        {user.image ? (
                          <img 
                            src={user.image} 
                            alt={user.name || user.email || 'User'} 
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              // Fallback to icon if image fails to load
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-10 h-10 bg-muted rounded-full flex items-center justify-center ${user.image ? 'hidden' : ''}`}>
                          <RoleIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 
                            className="font-medium cursor-pointer hover:text-primary transition-colors"
                            onClick={() => setSelectedUser(user)}
                          >
                            {user.name || user.email || 'Unknown User'}
                          </h3>
                          <Badge className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {user.email}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                          <span>Views: {(user.totalViews || 0).toLocaleString()}</span>
                          <span>Earnings: ${(user.totalEarnings || 0).toFixed(2)}</span>
                          <span>Submissions: {user._count?.clipSubmissions || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
                })}
              </div>
            )}

            {!loading && filteredUsers.length === 0 && users.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No users found</h3>
                <p className="text-muted-foreground mb-4">
                  {session?.user?.role === "ADMIN"
                    ? "No users are registered in the system yet, or there may be an authentication issue."
                    : "You don't have permission to view user management."
                  }
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={fetchUsers} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Loading
                  </Button>
                  {session?.user?.role !== "ADMIN" && (
                    <Button
                      onClick={() => window.location.href = "/creators/login"}
                      variant="outline"
                    >
                      Sign In as Admin
                    </Button>
                  )}
                </div>
              </div>
            )}

            {!loading && filteredUsers.length === 0 && users.length > 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No users match your search</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search terms.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Detail Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">User Details</h2>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                    ×
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <p className="text-sm">{selectedUser.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <p className="text-sm">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Role</label>
                      <Badge className={getRoleColor(selectedUser.role)}>
                        {selectedUser.role}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Joined</label>
                      <p className="text-sm">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Total Views</label>
                      <p className="text-lg font-semibold">{(selectedUser.totalViews || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Total Earnings</label>
                      <p className="text-lg font-semibold text-green-500">${(selectedUser.totalEarnings || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Submissions</label>
                      <p className="text-lg font-semibold">{selectedUser._count?.clipSubmissions || 0}</p>
                    </div>
                  </div>

                  {/* Payout Information */}
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium flex items-center gap-2 mb-3">
                      <DollarSign className="w-4 h-4" />
                      Payout Information
                    </label>
                    
                    {/* Pending Payout Request Alert */}
                    {selectedUser.pendingPayoutRequest && (
                      <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-500 mb-1">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-medium text-sm">Pending Payout Request</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-semibold">${selectedUser.pendingPayoutRequest.amount.toFixed(2)}</span>
                          <span className="text-muted-foreground"> via {selectedUser.pendingPayoutRequest.paymentMethod || 'N/A'}</span>
                          <span className="text-muted-foreground ml-2">
                            ({new Date(selectedUser.pendingPayoutRequest.requestedAt).toLocaleDateString()})
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {/* PayPal */}
                      <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium">PayPal:</span>
                        </div>
                        {selectedUser.paypalEmail ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono">{selectedUser.paypalEmail}</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                navigator.clipboard.writeText(selectedUser.paypalEmail || '')
                                toast.success('PayPal email copied!')
                              }}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not set</span>
                        )}
                      </div>

                      {/* Ethereum Wallet */}
                      <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium">Ethereum:</span>
                        </div>
                        {selectedUser.walletAddress ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono truncate max-w-[200px]" title={selectedUser.walletAddress}>
                              {selectedUser.walletAddress.slice(0, 6)}...{selectedUser.walletAddress.slice(-4)}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                navigator.clipboard.writeText(selectedUser.walletAddress || '')
                                toast.success('Wallet address copied!')
                              }}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not set</span>
                        )}
                      </div>

                      {/* Bitcoin */}
                      <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium">Bitcoin:</span>
                        </div>
                        {selectedUser.bitcoinAddress ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono truncate max-w-[200px]" title={selectedUser.bitcoinAddress}>
                              {selectedUser.bitcoinAddress.slice(0, 6)}...{selectedUser.bitcoinAddress.slice(-4)}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                navigator.clipboard.writeText(selectedUser.bitcoinAddress || '')
                                toast.success('Bitcoin address copied!')
                              }}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not set</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Verified Social Accounts */}
                  {selectedUser.socialAccounts && selectedUser.socialAccounts.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">Verified Social Accounts</label>
                      <div className="mt-2 space-y-3">
                        {selectedUser.socialAccounts.map((account) => (
                          <div key={account.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="text-lg">
                                {getSocialPlatformIcon(account.platform)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{account.displayName || account.username}</p>
                                  <Badge variant="secondary" className="text-xs">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Verified
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  @{account.username} • {getSocialPlatformName(account.platform)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                {account.followers ? `${account.followers.toLocaleString()} followers` : 'Followers: N/A'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Verified: {account.verifiedAt ? new Date(account.verifiedAt).toLocaleDateString() : 'Unknown'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show message if no verified accounts */}
                  {(!selectedUser.socialAccounts || selectedUser.socialAccounts.length === 0) && (
                    <div>
                      <label className="text-sm font-medium">Verified Social Accounts</label>
                      <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground text-center">
                          No verified social accounts found for this user
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Role Management Actions */}
                  <div className="pt-4 border-t">
                    <label className="text-sm font-medium">Role Management</label>
                    <div className="mt-2 flex gap-3">
                      {selectedUser.role !== "ADMIN" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            promoteToAdmin(selectedUser.id)
                            setSelectedUser(null) // Close modal after action
                          }}
                          className="flex-1"
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Promote to Admin
                        </Button>
                      )}
                      {selectedUser.role === "ADMIN" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1">
                              <UserX className="h-4 w-4 mr-2" />
                              Demote to Clipper
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Demote Admin</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to demote {selectedUser.name || selectedUser.email} from admin to clipper? They will lose admin access immediately.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  demoteFromAdmin(selectedUser.id)
                                  setSelectedUser(null) // Close modal after action
                                }}
                              >
                                Demote
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
