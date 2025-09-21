"use client"

import { useState } from "react"
import {
  Instagram,
  Youtube,
  Twitter,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  ExternalLink,
  Shield,
  AlertCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import toast from "react-hot-toast"

// User's connected social accounts - will be loaded from database
const connectedAccounts: any[] = []

const platformConfigs = {
  instagram: {
    name: "Instagram",
    icon: Instagram,
    color: "#E4405F",
    requirements: ["Public account", "At least 100 followers", "Active posting history"]
  },
  tiktok: {
    name: "TikTok",
    icon: Youtube, // Using YouTube icon as placeholder for TikTok
    color: "#000000",
    requirements: ["Public account", "At least 50 followers", "Active posting history"]
  },
  youtube: {
    name: "YouTube",
    icon: Youtube,
    color: "#FF0000",
    requirements: ["Public channel", "At least 25 subscribers", "Active posting history"]
  },
  twitter: {
    name: "Twitter/X",
    icon: Twitter,
    color: "#1DA1F2",
    requirements: ["Public account", "At least 50 followers", "Active posting history"]
  }
}

function AccountCard({ account }: { account: typeof connectedAccounts[0] }) {
  const platform = platformConfigs[account.platform as keyof typeof platformConfigs]
  const Icon = platform.icon

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-foreground'
      case 'pending_verification': return 'text-yellow-400'
      case 'suspended': return 'text-red-400'
      default: return 'text-muted-foreground'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active'
      case 'pending_verification': return 'Pending Verification'
      case 'suspended': return 'Suspended'
      default: return 'Unknown'
    }
  }

  const handleDisconnect = () => {
    toast.success(`Disconnected ${platform.name} account`)
    // TODO: Implement disconnect logic
  }

  return (
    <Card className="bg-card border-gray-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: platform.color + '20' }}
            >
              <Icon className="w-5 h-5" style={{ color: platform.color }} />
            </div>
            <div>
              <h3 className="text-white font-medium">{platform.name}</h3>
              <p className="text-muted-foreground text-sm">{account.handle}</p>
            </div>
          </div>
          <Badge variant="outline" className={getStatusColor(account.status)}>
            {getStatusText(account.status)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-muted-foreground text-sm">Followers</p>
            <p className="text-white font-medium">{account.followers.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Connected</p>
            <p className="text-white font-medium">
              {new Date(account.connectedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {account.verified ? (
              <>
                <CheckCircle className="w-4 h-4 text-foreground" />
                <span className="text-foreground text-sm">Verified</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm">Unverified</span>
              </>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:bg-muted">
              <ExternalLink className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              className="border-red-700 text-red-400 hover:bg-red-900"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ConnectAccountDialog() {
  const [selectedPlatform, setSelectedPlatform] = useState("")
  const [accountHandle, setAccountHandle] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    if (!selectedPlatform || !accountHandle) {
      toast.error("Please fill in all fields")
      return
    }

    setIsConnecting(true)
    // TODO: Implement account connection logic
    await new Promise(resolve => setTimeout(resolve, 1500))
    toast.success(`Connected ${platformConfigs[selectedPlatform as keyof typeof platformConfigs].name} account`)
    setIsConnecting(false)
    setSelectedPlatform("")
    setAccountHandle("")
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-foreground hover:bg-foreground/90">
          <Plus className="w-4 h-4 mr-2" />
          Connect Account
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Connect Social Account</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <Label htmlFor="platform" className="text-white">Platform</Label>
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="bg-muted border-border text-white">
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                {Object.entries(platformConfigs).map(([key, config]) => (
                  <SelectItem key={key} value={key} className="text-white">
                    {config.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="handle" className="text-white">Account Handle/Username</Label>
            <Input
              id="handle"
              value={accountHandle}
              onChange={(e) => setAccountHandle(e.target.value)}
              placeholder="@username or channel name"
              className="bg-muted border-border text-white"
            />
          </div>

          {selectedPlatform && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="text-white font-medium mb-2">Requirements:</h4>
              <ul className="text-muted-foreground text-sm space-y-1">
                {platformConfigs[selectedPlatform as keyof typeof platformConfigs].requirements.map((req, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="w-3 h-3 text-foreground mr-2" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button
            onClick={handleConnect}
            disabled={isConnecting || !selectedPlatform || !accountHandle}
            className="w-full bg-foreground hover:bg-foreground/90"
          >
            {isConnecting ? "Connecting..." : "Connect Account"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PlatformRequirements() {
  return (
    <Card className="bg-card border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Shield className="w-5 h-5 mr-2 text-white" />
          Platform Requirements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(platformConfigs).map(([key, config]) => {
            const Icon = config.icon
            return (
              <div key={key} className="flex items-start space-x-3 p-3 border border-border rounded-lg">
                <Icon className="w-6 h-6 mt-0.5" style={{ color: config.color }} />
                <div className="flex-1">
                  <h4 className="text-white font-medium mb-1">{config.name}</h4>
                  <ul className="text-muted-foreground text-sm space-y-0.5">
                    {config.requirements.map((req, index) => (
                      <li key={index}>• {req}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default function SocialAccountsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-white mb-2">Social Accounts</h1>
          <p className="text-muted-foreground">Manage your connected social media accounts for clipping.</p>
        </div>
        <ConnectAccountDialog />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Accounts</p>
                <p className="text-2xl font-bold text-white">{connectedAccounts.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Verified Accounts</p>
                <p className="text-2xl font-bold text-foreground">
                  {connectedAccounts.filter(a => a.verified).length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Followers</p>
                <p className="text-2xl font-bold text-white">
                  {connectedAccounts.reduce((sum, acc) => sum + acc.followers, 0).toLocaleString()}
                </p>
              </div>
              <Twitter className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connected Accounts */}
      <div className="space-y-6">
        <h2 className="text-xl font-medium text-white">Connected Accounts</h2>
        {connectedAccounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {connectedAccounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No accounts connected</h3>
            <p className="text-muted-foreground mb-6">
              Connect your social media accounts to start earning from campaigns
            </p>
            <ConnectAccountDialog />
          </div>
        )}
      </div>

      {/* Platform Requirements */}
      <PlatformRequirements />

      {/* Verification Notice */}
      <Card className="bg-yellow-900/20 border-yellow-700/50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-yellow-400 mt-0.5" />
            <div>
              <h3 className="text-yellow-400 font-medium mb-2">Account Verification Required</h3>
              <p className="text-muted-foreground text-sm mb-3">
                All connected accounts must be verified to participate in campaigns and receive payments.
                Unverified accounts can still be connected but won't be eligible for earnings.
              </p>
              <Button variant="outline" className="border-yellow-700 text-yellow-400 hover:bg-yellow-900/20">
                Start Verification Process
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
