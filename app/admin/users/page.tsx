"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Search, UserCheck, UserX, Shield, Users, Crown, Eye, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface User {
  id: string
  name: string | null
  email: string | null
  role: "CLIPPER" | "CREATOR" | "ADMIN"
  createdAt: string
  totalViews: number
  totalEarnings: number
  _count?: {
    submissions: number
  }
}

const roleOptions = [
  { value: "all", label: "All Roles" },
  { value: "ADMIN", label: "Admins" },
  { value: "CREATOR", label: "Creators" },
  { value: "CLIPPER", label: "Clippers" }
]

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
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
      router.push("/clippers/login?error=AccessDenied")
      return
    }

    if (session.user?.role !== "ADMIN") {
      console.log("❌ User is not admin, redirecting to dashboard")
      router.push("/clippers/dashboard?error=AdminAccessRequired")
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
        console.error("❌ Authentication error - redirecting to login")
        toast.error("Authentication expired. Please sign in again.")
        // Force redirect to login page
        window.location.href = "/clippers/login?error=SessionExpired"
        return
      } else if (response.status === 403) {
        console.error("❌ Admin access denied")
        toast.error("Admin access required")
        window.location.href = "/clippers/dashboard?error=AdminAccessRequired"
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
      case "CREATOR": return "bg-muted border border-border text-foreground"
      case "CLIPPER": return "bg-muted border border-border text-foreground"
      default: return "bg-muted border border-border text-foreground"
    }
  }

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN": return Crown
      case "CREATOR": return Shield
      case "CLIPPER": return Users
      default: return Users
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Calculate stats - only calculate when users are loaded
  const adminCount = users.filter(u => u.role === "ADMIN").length
  const creatorCount = users.filter(u => u.role === "CREATOR").length
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  ← Back to Admin
                </Button>
              </Link>
              <h1 className="text-3xl font-light">User Management</h1>
            </div>
            <p className="text-muted-foreground">
              Manage user roles and permissions
            </p>
            {/* Debug info for development */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-2 text-xs text-muted-foreground">
                <p>Session: {session ? "authenticated" : "not authenticated"}</p>
                <p>Role: {session?.user?.role || "none"}</p>
                <p>Users loaded: {users.length}</p>
              </div>
            )}
          </div>
        </div>

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
                <Shield className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Creators</p>
                  <p className="text-2xl font-semibold">{creatorCount}</p>
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
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <RoleIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-medium">
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
                          <span>Views: {user.totalViews.toLocaleString()}</span>
                          <span>Earnings: ${user.totalEarnings.toFixed(2)}</span>
                          <span>Submissions: {user._count?.submissions || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.role !== "ADMIN" && (
                        <Button
                          size="sm"
                          onClick={() => promoteToAdmin(user.id)}
                        >
                          <Crown className="h-4 w-4 mr-1" />
                          Promote
                        </Button>
                      )}
                      {user.role === "ADMIN" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <UserX className="h-4 w-4 mr-1" />
                              Demote
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Demote Admin</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to demote this admin to clipper? They will lose admin access.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => demoteFromAdmin(user.id)}
                              >
                                Demote
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
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
                      onClick={() => window.location.href = "/clippers/login"}
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
                      <p className="text-lg font-semibold">{selectedUser.totalViews.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Total Earnings</label>
                      <p className="text-lg font-semibold">${selectedUser.totalEarnings.toFixed(2)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Submissions</label>
                      <p className="text-lg font-semibold">{selectedUser._count?.submissions || 0}</p>
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
