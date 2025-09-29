"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Edit, Trash2, Eye, Users, DollarSign, TrendingUp, Calendar, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface Campaign {
  id: string
  title: string
  description: string
  creator: string
  budget: number
  spent: number
  minPayout: number
  maxPayout: number
  deadline: string
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED"
  targetPlatforms: string[]
  requirements: string[]
  createdAt: string
  _count: {
    submissions: number
  }
  submissions: Array<{
    id: string
    user: {
      id: string
      name: string | null
      email: string | null
    }
    clipUrl: string
    platform: string
    status: string
    createdAt: string
  }>
}

const platformOptions = [
  { value: "TIKTOK", label: "TikTok" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "TWITTER", label: "Twitter" },
  { value: "FACEBOOK", label: "Facebook" }
]

const statusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" }
]

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    creator: "",
    budget: "",
    minPayout: "",
    maxPayout: "",
    deadline: "",
    startDate: "",
    targetPlatforms: [] as string[],
    requirements: [] as string[],
    status: "ACTIVE" as Campaign["status"],
    featured: false,
    imageUrl: "",
    tags: [] as string[]
  })

  // Fetch campaigns
  const fetchCampaigns = async () => {
    try {
      const response = await fetch("/api/campaigns")
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data)
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error)
      toast.error("Failed to fetch campaigns")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  // Create campaign
  const handleCreateCampaign = async () => {
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formData,
          budget: parseFloat(formData.budget),
          minPayout: parseFloat(formData.minPayout),
          maxPayout: parseFloat(formData.maxPayout)
        })
      })

      if (response.ok) {
        toast.success("Campaign created successfully")
        setShowCreateDialog(false)
        resetForm()
        fetchCampaigns()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create campaign")
      }
    } catch (error) {
      console.error("Error creating campaign:", error)
      toast.error("Failed to create campaign")
    }
  }

  // Update campaign
  const handleUpdateCampaign = async () => {
    if (!selectedCampaign) return

    try {
      const response = await fetch(`/api/admin/campaigns/${selectedCampaign.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success("Campaign updated successfully")
        setShowEditDialog(false)
        resetForm()
        fetchCampaigns()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update campaign")
      }
    } catch (error) {
      console.error("Error updating campaign:", error)
      toast.error("Failed to update campaign")
    }
  }

  // Delete campaign
  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Campaign deleted successfully")
        fetchCampaigns()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete campaign")
      }
    } catch (error) {
      console.error("Error deleting campaign:", error)
      toast.error("Failed to delete campaign")
    }
  }

  // Edit campaign
  const handleEditCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setFormData({
      title: campaign.title,
      description: campaign.description,
      creator: campaign.creator,
      budget: campaign.budget.toString(),
      minPayout: campaign.minPayout.toString(),
      maxPayout: campaign.maxPayout.toString(),
      deadline: new Date(campaign.deadline).toISOString().slice(0, 16),
      targetPlatforms: campaign.targetPlatforms,
      requirements: campaign.requirements,
      status: campaign.status
    })
    setShowEditDialog(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      creator: "",
      budget: "",
      minPayout: "",
      maxPayout: "",
      deadline: "",
      startDate: "",
      targetPlatforms: [],
      requirements: [],
      status: "ACTIVE",
      featured: false,
      imageUrl: "",
      tags: []
    })
    setSelectedCampaign(null)
  }

  // Get status badge color
  const getStatusColor = (status: Campaign["status"]) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800"
      case "DRAFT": return "bg-gray-100 text-gray-800"
      case "PAUSED": return "bg-yellow-100 text-yellow-800"
      case "COMPLETED": return "bg-blue-100 text-blue-800"
      case "CANCELLED": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  // Calculate campaign stats
  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0)
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0)
  const totalSubmissions = campaigns.reduce((sum, c) => sum + c._count.submissions, 0)
  const activeCampaigns = campaigns.filter(c => c.status === "ACTIVE").length

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading campaigns...</div>
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
            <h1 className="text-3xl font-light mb-2">Campaign Management</h1>
            <p className="text-muted-foreground">
              Create and manage brand activation campaigns
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Campaign</DialogTitle>
              </DialogHeader>
              <CampaignForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleCreateCampaign}
                onCancel={() => setShowCreateDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
                  <p className="text-2xl font-semibold">{activeCampaigns}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-semibold">${totalBudget.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Submissions</p>
                  <p className="text-2xl font-semibold">{totalSubmissions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Budget Spent</p>
                  <p className="text-2xl font-semibold">${totalSpent.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns List */}
        <Card>
          <CardHeader>
            <CardTitle>All Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{campaign.title}</h3>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {campaign.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Budget: ${campaign.budget.toLocaleString()}</span>
                      <span>Spent: ${campaign.spent.toLocaleString()}</span>
                      <span>Submissions: {campaign._count.submissions}</span>
                      <span>Deadline: {new Date(campaign.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCampaign(campaign)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCampaign(campaign)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{campaign.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCampaign(campaign.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Campaign Detail Modal */}
        {selectedCampaign && (
          <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedCampaign.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Campaign Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Creator:</span> {selectedCampaign.creator}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <Badge className={`ml-2 ${getStatusColor(selectedCampaign.status)}`}>
                        {selectedCampaign.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Budget:</span> ${selectedCampaign.budget.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Spent:</span> ${selectedCampaign.spent.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Deadline:</span> {new Date(selectedCampaign.deadline).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Submissions:</span> {selectedCampaign._count.submissions}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Target Platforms</h3>
                  <div className="flex gap-2">
                    {selectedCampaign.targetPlatforms.map((platform) => (
                      <Badge key={platform} variant="secondary">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Requirements</h3>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {selectedCampaign.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Recent Submissions</h3>
                  <div className="space-y-2">
                    {selectedCampaign.submissions.slice(0, 5).map((submission) => (
                      <div key={submission.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{submission.user.name || submission.user.email}</p>
                          <p className="text-sm text-muted-foreground">{submission.clipUrl}</p>
                        </div>
                        <Badge variant={submission.status === "APPROVED" ? "default" : "secondary"}>
                          {submission.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Campaign Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Campaign</DialogTitle>
            </DialogHeader>
            <CampaignForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleUpdateCampaign}
              onCancel={() => setShowEditDialog(false)}
              isEdit={true}
            />
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  )
}

// Campaign Form Component
function CampaignForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isEdit = false
}: {
  formData: any
  setFormData: (data: any) => void
  onSubmit: () => void
  onCancel: () => void
  isEdit?: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Campaign title"
          />
        </div>
        <div>
          <Label htmlFor="creator">Creator</Label>
          <Input
            id="creator"
            value={formData.creator}
            onChange={(e) => setFormData({ ...formData, creator: e.target.value })}
            placeholder="Brand or creator name"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Campaign description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="budget">Budget ($)</Label>
          <Input
            id="budget"
            type="number"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            placeholder="1000"
          />
        </div>
        <div>
          <Label htmlFor="minPayout">Min Payout ($)</Label>
          <Input
            id="minPayout"
            type="number"
            step="0.01"
            value={formData.minPayout}
            onChange={(e) => setFormData({ ...formData, minPayout: e.target.value })}
            placeholder="0.50"
          />
        </div>
        <div>
          <Label htmlFor="maxPayout">Max Payout ($)</Label>
          <Input
            id="maxPayout"
            type="number"
            step="0.01"
            value={formData.maxPayout}
            onChange={(e) => setFormData({ ...formData, maxPayout: e.target.value })}
            placeholder="5.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            id="deadline"
            type="datetime-local"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Target Platforms</Label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {platformOptions.map((platform) => (
            <label key={platform.value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.targetPlatforms.includes(platform.value)}
                onChange={(e) => {
                  const platforms = e.target.checked
                    ? [...formData.targetPlatforms, platform.value]
                    : formData.targetPlatforms.filter((p: string) => p !== platform.value)
                  setFormData({ ...formData, targetPlatforms: platforms })
                }}
                className="rounded"
              />
              <span className="text-sm">{platform.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          {isEdit ? "Update" : "Create"} Campaign
        </Button>
      </div>
    </div>
  )
}
