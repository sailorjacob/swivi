"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Plus, Edit, Trash2, Users, DollarSign, TrendingUp, Calendar, Target, Loader2, CheckCircle, ChevronDown, ChevronUp, EyeOff, Eye, FlaskConical, ArchiveRestore, Archive } from "lucide-react"
import { authenticatedFetch } from "@/lib/supabase-browser"
import { supabase } from "@/lib/supabase-auth"
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
import { FileUpload } from "@/components/ui/file-upload"
import toast from "react-hot-toast"

interface Campaign {
  id: string
  title: string
  description: string
  creator: string
  budget: number
  spent: number
  payoutRate: number
  startDate?: string | Date | null
  status: "DRAFT" | "SCHEDULED" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED"
  hidden?: boolean
  isTest?: boolean
  deletedAt?: string | Date | null
  targetPlatforms: string[]
  requirements: string[]
  featuredImage?: string | null
  createdAt: string | Date
  updatedAt?: string | Date
  _count: {
    clipSubmissions: number
  }
  clipSubmissions?: Array<{
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
  { value: "TWITTER", label: "Twitter" }
]

const statusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" }
]

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set())
  const [expandedCampaignData, setExpandedCampaignData] = useState<Record<string, any>>({})
  const [loadingCampaignData, setLoadingCampaignData] = useState<Set<string>>(new Set())
  const [isUpdating, setIsUpdating] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    creator: "",
    budget: "",
    payoutRate: "",
    startDate: "",
    targetPlatforms: [] as string[],
    requirements: [] as string[],
    status: "ACTIVE" as Campaign["status"],
    featuredImage: ""
  })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch campaigns
  const fetchCampaigns = async () => {
    try {
      // Admin should see ALL campaigns including DRAFT ones
      const response = await authenticatedFetch("/api/campaigns?status=all")
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 Fetched campaigns data:', data)
        console.log('🔍 First campaign featuredImage:', data[0]?.featuredImage)
        setCampaigns(data)
      } else if (response.status === 401) {
        toast.error("Please log in to view campaigns")
      } else if (response.status >= 500) {
        console.log('🔍 Server error loading campaigns - showing empty state')
        setCampaigns([])
        toast.error("Server error loading campaigns. Please try again.")
      } else {
        toast.error("Failed to fetch campaigns")
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error)
      setCampaigns([])
      toast.error("Failed to fetch campaigns")
    }
  }

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const response = await authenticatedFetch("/api/admin/analytics/aggregate")
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else if (response.status === 401) {
        console.warn("Admin analytics: Authentication required")
      } else if (response.status >= 500) {
        console.log('🔍 Server error loading analytics - continuing without analytics')
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    }
  }

  useEffect(() => {
    fetchCampaigns()
    fetchAnalytics()

    // Set up interval to refresh analytics every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000)

    return () => clearInterval(interval)
  }, [])

  // Create campaign
  const handleCreateCampaign = async () => {
    console.log("🚀 handleCreateCampaign started")
    setIsSubmitting(true)
    try {
      // Handle image upload first if there's a file (optional)
      let imageUrl = formData.featuredImage
      console.log("🖼️ Initial imageUrl from form:", imageUrl)
      console.log("📎 Uploaded file:", uploadedFile)

      if (uploadedFile) {
        try {
          const formDataUpload = new FormData()
          formDataUpload.append('file', uploadedFile)
          formDataUpload.append('bucket', 'images')

          console.log('🚀 Starting image upload...', {
            fileName: uploadedFile.name,
            fileSize: uploadedFile.size,
            fileType: uploadedFile.type
          })

          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: formDataUpload
          })

          console.log('📊 Upload response status:', uploadResponse.status)

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json()
            imageUrl = uploadResult.url
            console.log('✅ Image uploaded successfully:', uploadResult.url)
          } else {
            const errorText = await uploadResponse.text()
            console.error('❌ Image upload failed:', uploadResponse.status, errorText)
            toast.error(`Image upload failed (${uploadResponse.status}): ${errorText}`)
            // Don't continue with campaign creation if image upload fails
            setIsSubmitting(false)
            return
          }
        } catch (error) {
          console.error('❌ Image upload error:', error)
          toast.error("Image upload failed. Please try again.")
          setIsSubmitting(false)
          return
        }
      }

      console.log("🎯 Final imageUrl to use:", imageUrl)

      console.log("🔍 Starting validation...")
      console.log("🔍 Form data for validation:", {
        title: formData.title,
        description: formData.description,
        creator: formData.creator,
        budget: formData.budget,
        payoutRate: formData.payoutRate,
        targetPlatforms: formData.targetPlatforms,
        targetPlatformsLength: formData.targetPlatforms?.length
      })
      
      // Validate required fields
      if (!formData.title?.trim()) {
        console.log("❌ Validation failed: title missing")
        toast.error("Campaign title is required")
        setIsSubmitting(false)
        return
      }

      if (!formData.description?.trim() || formData.description.length < 10) {
        toast.error("Description must be at least 10 characters")
        setIsSubmitting(false)
        return
      }

      if (!formData.creator?.trim()) {
        toast.error("Creator name is required")
        setIsSubmitting(false)
        return
      }

      const budget = parseFloat(formData.budget)
      if (isNaN(budget) || budget <= 0) {
        toast.error("Budget must be a positive number")
        setIsSubmitting(false)
        return
      }

      const payoutRate = parseFloat(formData.payoutRate)
      if (isNaN(payoutRate) || payoutRate <= 0) {
        toast.error("Payout rate must be a positive number")
        setIsSubmitting(false)
        return
      }

      if (!formData.targetPlatforms || formData.targetPlatforms.length === 0) {
        console.log("❌ Validation failed: no platforms selected")
        console.log("❌ targetPlatforms:", formData.targetPlatforms)
        toast.error("At least one platform must be selected")
        setIsSubmitting(false)
        return
      }

      console.log("✅ Validation passed, creating request body...")
      
      // Convert datetime-local value (local time) to ISO string for API
      // datetime-local gives us "YYYY-MM-DDTHH:MM" in local time
      // We need to create a Date object and convert to ISO for proper UTC storage
      let startDateISO = null
      if (formData.startDate) {
        const localDate = new Date(formData.startDate)
        startDateISO = localDate.toISOString()
        console.log("📅 Converting startDate:", formData.startDate, "→", startDateISO)
      }
      
      const requestBody: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        creator: formData.creator.trim(),
        budget,
        payoutRate,
        startDate: startDateISO,
        targetPlatforms: formData.targetPlatforms,
        requirements: formData.requirements || [],
        status: formData.status,
      }

      // Only include featuredImage if we have a valid URL
      if (imageUrl && imageUrl.trim() !== '') {
        requestBody.featuredImage = imageUrl
        console.log("✅ Including featuredImage in request:", imageUrl)
      } else {
        console.log("❌ No valid image URL, omitting featuredImage field")
      }

      console.log("🚀 Sending campaign creation request:", JSON.stringify(requestBody, null, 2))

      console.log("📡 Calling authenticatedFetch...")
      const response = await authenticatedFetch("/api/campaigns", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      console.log("📊 Campaign creation response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (response.ok) {
        const result = await response.json()
        console.log("✅ Campaign created successfully:", result)
        toast.success("Campaign created successfully!")
        // Show success state briefly before closing
        setTimeout(() => {
          setShowCreateDialog(false)
          resetForm()
          fetchCampaigns()
        }, 1500)
      } else {
        const errorText = await response.text()
        console.error("❌ Campaign creation failed:", {
          status: response.status,
          statusText: response.statusText,
          errorText
        })
        
        let errorMessage = "Failed to create campaign"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          errorMessage = errorText || errorMessage
        }
        
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error("Error creating campaign:", error)
      toast.error("Failed to create campaign")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update campaign
  const handleUpdateCampaign = async () => {
    if (!editingCampaignId) {
      console.error('❌ No editing campaign ID for update')
      return
    }

    console.log('🔄 Starting campaign update for:', editingCampaignId)
    console.log('📝 Form data to update:', formData)

    // Validate required fields for update
    if (!formData.title?.trim()) {
      toast.error("Campaign title is required")
      return
    }

    if (!formData.description?.trim() || formData.description.length < 10) {
      toast.error("Description must be at least 10 characters")
      return
    }

    if (!formData.creator?.trim()) {
      toast.error("Creator name is required")
      return
    }

    const budget = parseFloat(formData.budget)
    if (isNaN(budget) || budget <= 0) {
      toast.error("Budget must be a positive number")
      return
    }

    const payoutRate = parseFloat(formData.payoutRate)
    if (isNaN(payoutRate) || payoutRate <= 0) {
      toast.error("Payout rate must be a positive number")
      return
    }


    if (!formData.targetPlatforms || formData.targetPlatforms.length === 0) {
      toast.error("At least one platform must be selected")
      return
    }

    setIsUpdating(true)
    try {
      // Handle image upload first if there's a new file (optional)
      let imageUrl = formData.featuredImage
      console.log('🔄 Update - Initial imageUrl from formData:', imageUrl)
      console.log('🔄 Update - uploadedFile:', uploadedFile)

      if (uploadedFile) {
        console.log('📸 Uploading new image:', uploadedFile.name)
        try {
          const formDataUpload = new FormData()
          formDataUpload.append('file', uploadedFile)
          formDataUpload.append('bucket', 'images')

          console.log('🚀 Starting image upload for update...', {
            fileName: uploadedFile.name,
            fileSize: uploadedFile.size,
            fileType: uploadedFile.type
          })

          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: formDataUpload
          })

          console.log('📊 Upload response status:', uploadResponse.status)

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json()
            imageUrl = uploadResult.url
            console.log('✅ Image uploaded successfully:', imageUrl)
          } else {
            const errorText = await uploadResponse.text()
            console.error('❌ Image upload failed:', uploadResponse.status, errorText)
            toast.error(`Image upload failed (${uploadResponse.status}): ${errorText}`)
            // Don't continue with campaign update if image upload fails
            setIsUpdating(false)
            return
          }
        } catch (error) {
          console.error('❌ Image upload error:', error)
          toast.error("Image upload failed. Please try again.")
          setIsUpdating(false)
          return
        }
      }

      // Convert datetime-local value (local time) to ISO string for API
      let updateStartDateISO = null
      if (formData.startDate) {
        const localDate = new Date(formData.startDate)
        updateStartDateISO = localDate.toISOString()
        console.log("📅 Converting update startDate:", formData.startDate, "→", updateStartDateISO)
      }
      
      const updatePayload: any = {
          title: formData.title,
          description: formData.description,
          creator: formData.creator,
        budget: parseFloat(formData.budget) || 0,
        payoutRate: parseFloat(formData.payoutRate) || 0,
          startDate: updateStartDateISO,
          targetPlatforms: formData.targetPlatforms,
          requirements: formData.requirements,
          status: formData.status,
      }

      // Handle featuredImage in update payload
      if (imageUrl && imageUrl.trim() !== '') {
        // We have a valid image URL (either existing or newly uploaded)
        updatePayload.featuredImage = imageUrl
        console.log("✅ Including featuredImage in update:", imageUrl)
      } else if (imageUrl === null) {
        // Image upload failed or we want to explicitly remove the image
        updatePayload.featuredImage = null
        console.log("✅ Setting featuredImage to null (removing image)")
      } else if (formData.featuredImage && formData.featuredImage.trim() !== '') {
        // We have an existing image URL in the form data
        updatePayload.featuredImage = formData.featuredImage
        console.log("✅ Preserving existing featuredImage:", formData.featuredImage)
      } else {
        // No image URL at all - this shouldn't happen in normal flow
        console.log("❌ No image URL available, omitting featuredImage field")
      }

      console.log('🚀 Sending update payload:', updatePayload)

      const response = await authenticatedFetch(`/api/admin/campaigns/${editingCampaignId}`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload)
      })

      console.log('📡 Update response status:', response.status)

      if (response.ok) {
        const updatedCampaign = await response.json()
        console.log('✅ Campaign updated successfully:', updatedCampaign)
        
        toast.success("Campaign updated successfully!")
        
        // Close dialog and refresh list
          setShowEditDialog(false)
        setEditingCampaignId(null)
          resetForm()
        await fetchCampaigns()
        
        console.log('🔄 Campaign list refreshed')
      } else {
        const error = await response.json()
        console.error('❌ Update failed:', error)
        toast.error(error.error || "Failed to update campaign")
      }
    } catch (error) {
      console.error("❌ Error updating campaign:", error)
      toast.error("Failed to update campaign")
    } finally {
      setIsUpdating(false)
    }
  }

  // Toggle campaign visibility
  const handleToggleHidden = async (campaignId: string, currentlyHidden: boolean) => {
    try {
      const response = await authenticatedFetch(`/api/admin/campaigns/${campaignId}`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hidden: !currentlyHidden
        })
      })

      if (response.ok) {
        toast.success(currentlyHidden ? "Campaign is now visible to clippers" : "Campaign hidden from clippers")
        await fetchCampaigns()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update campaign visibility")
      }
    } catch (error) {
      console.error("Error toggling campaign visibility:", error)
      toast.error("Failed to update campaign visibility")
    }
  }

  // Publish/Activate campaign
  const handlePublishCampaign = async (campaignId: string) => {
    try {
      const response = await authenticatedFetch(`/api/admin/campaigns/${campaignId}`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: "ACTIVE"
        })
      })

      if (response.ok) {
        toast.success("Campaign published successfully!")
        await fetchCampaigns()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to publish campaign")
      }
    } catch (error) {
      console.error("Error publishing campaign:", error)
      toast.error("Failed to publish campaign")
    }
  }

  // Complete campaign manually
  const handleCompleteCampaign = async (campaignId: string) => {
    if (!confirm("Are you sure you want to complete this campaign? This will finalize all earnings and stop view tracking.")) {
      return
    }

    try {
      const response = await authenticatedFetch(`/api/admin/campaigns/complete`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId,
          completionReason: "Manually completed by admin"
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Campaign completed! ${result.stats.approvedSubmissions} approved clips with total earnings of $${result.stats.totalEarnings.toFixed(2)}`)
        await fetchCampaigns()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to complete campaign")
      }
    } catch (error) {
      console.error("Error completing campaign:", error)
      toast.error("Failed to complete campaign")
    }
  }

  // Pause campaign
  const handlePauseCampaign = async (campaignId: string) => {
    try {
      const response = await authenticatedFetch(`/api/admin/campaigns/${campaignId}`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: "PAUSED"
        })
      })

      if (response.ok) {
        toast.success("Campaign paused. No new submissions will be accepted.")
        await fetchCampaigns()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to pause campaign")
      }
    } catch (error) {
      console.error("Error pausing campaign:", error)
      toast.error("Failed to pause campaign")
    }
  }

  // Resume paused campaign
  const handleResumeCampaign = async (campaignId: string) => {
    try {
      const response = await authenticatedFetch(`/api/admin/campaigns/${campaignId}`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: "ACTIVE"
        })
      })

      if (response.ok) {
        toast.success("Campaign resumed and accepting submissions again!")
        await fetchCampaigns()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to resume campaign")
      }
    } catch (error) {
      console.error("Error resuming campaign:", error)
      toast.error("Failed to resume campaign")
    }
  }

  // Reactivate completed campaign
  const handleReactivateCampaign = async (campaignId: string) => {
    if (!confirm("Are you sure you want to reactivate this completed campaign? This will allow new submissions and resume earnings tracking. Consider increasing the budget first.")) {
      return
    }

    try {
      const response = await authenticatedFetch(`/api/admin/campaigns/${campaignId}`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: "ACTIVE"
        })
      })

      if (response.ok) {
        toast.success("Campaign reactivated! Earnings tracking will resume.")
        await fetchCampaigns()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to reactivate campaign")
      }
    } catch (error) {
      console.error("Error reactivating campaign:", error)
      toast.error("Failed to reactivate campaign")
    }
  }

  // Archive campaign (soft delete)
  const handleDeleteCampaign = async (campaignId: string, isTest?: boolean) => {
    try {
      const response = await authenticatedFetch(`/api/admin/campaigns/${campaignId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        const result = await response.json()
        if (result.archived) {
          toast.success(`Campaign archived. ${result.earningsPreserved > 0 ? `$${result.earningsPreserved.toFixed(2)} in earnings preserved.` : ''}`)
        } else {
          toast.success("Campaign deleted")
        }
        await fetchCampaigns()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to archive campaign")
      }
    } catch (error) {
      console.error("Error archiving campaign:", error)
      toast.error("Failed to archive campaign")
    }
  }

  // Permanently delete campaign (hard delete - only for test campaigns)
  const handlePermanentDelete = async (campaignId: string) => {
    if (!confirm("PERMANENTLY DELETE this campaign and ALL its data? This cannot be undone. Only use for test campaigns.")) {
      return
    }

    try {
      const response = await authenticatedFetch(`/api/admin/campaigns/${campaignId}?hard=true`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Campaign permanently deleted")
        await fetchCampaigns()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete campaign")
      }
    } catch (error) {
      console.error("Error deleting campaign:", error)
      toast.error("Failed to delete campaign")
    }
  }

  // Restore archived campaign
  const handleRestoreCampaign = async (campaignId: string) => {
    try {
      const response = await authenticatedFetch(`/api/admin/campaigns/${campaignId}`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restore: true
        })
      })

      if (response.ok) {
        toast.success("Campaign restored to draft status")
        await fetchCampaigns()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to restore campaign")
      }
    } catch (error) {
      console.error("Error restoring campaign:", error)
      toast.error("Failed to restore campaign")
    }
  }

  // Toggle test campaign status
  const handleToggleTest = async (campaignId: string, currentlyTest: boolean) => {
    try {
      const response = await authenticatedFetch(`/api/admin/campaigns/${campaignId}`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isTest: !currentlyTest
        })
      })

      if (response.ok) {
        toast.success(currentlyTest ? "Campaign marked as real (included in stats)" : "Campaign marked as test (excluded from stats)")
        await fetchCampaigns()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update campaign")
      }
    } catch (error) {
      console.error("Error toggling test status:", error)
      toast.error("Failed to update campaign")
    }
  }

  // View campaign - fetch full details including submissions
  const handleViewCampaign = async (campaign: Campaign) => {
    try {
      console.log('🔍 Fetching full campaign details for:', campaign.id)
      const response = await authenticatedFetch(`/api/admin/campaigns/${campaign.id}`)
      if (response.ok) {
        const fullCampaign = await response.json()
        console.log('🔍 Full campaign data:', fullCampaign)
        setSelectedCampaign(fullCampaign)
        setShowViewDialog(true)
      } else {
        console.error('Failed to fetch campaign details:', response.status)
        toast.error("Failed to load campaign details")
      }
    } catch (error) {
      console.error('Error fetching campaign details:', error)
      toast.error("Failed to load campaign details")
    }
  }

  // Edit campaign
  const handleEditCampaign = (campaign: Campaign) => {
    console.log('🔧 Edit campaign called with:', campaign)
    
    try {
      // Ensure view dialog is closed when opening edit
      setShowViewDialog(false)
      // Store the campaign ID for updating
      setEditingCampaignId(campaign.id)
      
      // Safe date formatting with LOCAL timezone handling for datetime-local input
      const formatDateForInput = (dateValue: string | Date | undefined | null, fieldName: string) => {
        console.log(`📅 Formatting ${fieldName}:`, dateValue, typeof dateValue)
        
        if (!dateValue) {
          console.log(`📅 ${fieldName} is empty, returning empty string`)
          return ""
        }
        
        try {
          let date: Date
          if (typeof dateValue === 'string') {
            if (dateValue.trim() === '') {
              console.log(`📅 ${fieldName} is empty string, returning empty`)
              return ""
            }
            date = new Date(dateValue)
          } else if (dateValue instanceof Date) {
            date = dateValue
          } else {
            console.log(`📅 ${fieldName} is unexpected type:`, typeof dateValue)
            return ""
          }
          
          if (isNaN(date.getTime())) {
            console.log(`📅 ${fieldName} is invalid date:`, dateValue)
            return ""
          }
          
          // Format as LOCAL time for datetime-local input (not UTC!)
          // datetime-local expects: YYYY-MM-DDTHH:MM in local time
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const hours = String(date.getHours()).padStart(2, '0')
          const minutes = String(date.getMinutes()).padStart(2, '0')
          
          const localString = `${year}-${month}-${day}T${hours}:${minutes}`
          console.log(`📅 ${fieldName} local string:`, localString)
          return localString
        } catch (error) {
          console.error(`📅 Error formatting ${fieldName}:`, error, 'Value:', dateValue)
          return ""
        }
      }

      const formDataToSet = {
        title: campaign.title || "",
        description: campaign.description || "",
        creator: campaign.creator || "",
        budget: (campaign.budget || 0).toString(),
        payoutRate: (campaign.payoutRate || 0).toString(),
        startDate: formatDateForInput(campaign.startDate, 'startDate'),
        targetPlatforms: campaign.targetPlatforms || [],
        requirements: campaign.requirements || [],
        status: campaign.status || "DRAFT",
        featuredImage: campaign.featuredImage || "",
      }
      
      console.log('📝 Setting form data:', formDataToSet)
      console.log('🖼️ Current featuredImage:', campaign.featuredImage)
      setFormData(formDataToSet)
      // Don't clear uploadedFile here - it should be managed by the FileUpload component
      // setUploadedFile(null) // Clear any uploaded file when editing
      setShowEditDialog(true)
    } catch (error) {
      console.error('❌ Error in handleEditCampaign:', error)
      toast.error("Failed to open edit form. Please try again.")
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      creator: "",
      budget: "",
        payoutRate: "",
        startDate: "",
      targetPlatforms: [],
      requirements: [],
      status: "ACTIVE",
      featuredImage: ""
    })
    setUploadedFile(null)
    setSelectedCampaign(null)
    setEditingCampaignId(null)
  }

  // Get status badge color - minimal monochrome design
  const getStatusColor = (status: Campaign["status"]) => {
    switch (status) {
      case "ACTIVE": return "bg-foreground text-background font-medium"
      case "SCHEDULED": return "bg-muted border border-foreground/20 text-foreground"
      case "DRAFT": return "bg-muted border border-dashed border-border text-muted-foreground"
      case "PAUSED": return "bg-muted border-2 border-foreground/40 text-foreground"
      case "COMPLETED": return "bg-muted border border-border text-muted-foreground"
      case "CANCELLED": return "bg-muted border border-border text-muted-foreground line-through"
      default: return "bg-muted border border-border text-foreground"
    }
  }

  // State for status filter
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'SCHEDULED' | 'PAUSED' | 'COMPLETED' | 'DRAFT' | 'CANCELLED' | 'ARCHIVED' | 'TEST'>('all')

  // Calculate campaign stats
  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0)
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0)
  const totalSubmissions = campaigns.reduce((sum, c) => sum + c._count.clipSubmissions, 0)
  const activeCampaignsCount = campaigns.filter(c => c.status === "ACTIVE" && !c.deletedAt).length
  const scheduledCampaignsCount = campaigns.filter(c => c.status === "SCHEDULED" && !c.deletedAt).length
  const pausedCampaignsCount = campaigns.filter(c => c.status === "PAUSED" && !c.deletedAt).length
  const completedCampaignsCount = campaigns.filter(c => c.status === "COMPLETED" && !c.deletedAt).length
  const draftCampaignsCount = campaigns.filter(c => c.status === "DRAFT" && !c.deletedAt).length
  const cancelledCampaignsCount = campaigns.filter(c => c.status === "CANCELLED" && !c.deletedAt).length
  const archivedCampaignsCount = campaigns.filter(c => c.deletedAt).length
  const testCampaignsCount = campaigns.filter(c => c.isTest && !c.deletedAt).length

  // Filter campaigns based on status filter
  const filteredCampaigns = statusFilter === 'all' 
    ? campaigns.filter(c => !c.deletedAt) // Don't show archived in "all"
    : statusFilter === 'ARCHIVED'
    ? campaigns.filter(c => c.deletedAt)
    : statusFilter === 'TEST'
    ? campaigns.filter(c => c.isTest && !c.deletedAt)
    : campaigns.filter(c => c.status === statusFilter && !c.deletedAt)

  // Use analytics data if available
  const platformStats = analytics?.overview || {
    totalUsers: 0,
    totalCampaigns: campaigns.length,
    totalSubmissions,
    activeCampaigns: activeCampaignsCount,
    totalViews: 0,
    totalEarnings: 0
  }


  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Campaign Creation Form */}
        {showCreateDialog && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Campaign</CardTitle>
            </CardHeader>
            <CardContent>
              <CampaignForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleCreateCampaign}
                onCancel={() => setShowCreateDialog(false)}
                isSubmitting={isSubmitting}
                  uploadedFile={uploadedFile}
                  setUploadedFile={setUploadedFile}
              />
            </CardContent>
          </Card>
        )}

        {/* Stats Bar with Create Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Active:</span>
              <span className="font-semibold">{platformStats.activeCampaigns}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Users:</span>
              <span className="font-semibold">{platformStats.totalUsers}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Views:</span>
              <span className="font-semibold">{Number(platformStats.totalViews).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Earnings:</span>
              <span className="font-semibold">${platformStats.totalEarnings.toFixed(2)}</span>
            </div>
          </div>
          <Button onClick={() => setShowCreateDialog(!showCreateDialog)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {showCreateDialog ? "Cancel" : "New Campaign"}
          </Button>
        </div>

        {/* Campaign Status Filter Tabs */}
        <div className="flex flex-wrap gap-4 border-b border-border mb-6">
          <button
            onClick={() => setStatusFilter('all')}
            className={`pb-2 text-sm transition-colors ${
              statusFilter === 'all' 
                ? 'text-foreground border-b-2 border-foreground -mb-px' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All {campaigns.length > 0 && `(${campaigns.length})`}
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`pb-2 text-sm transition-colors ${
              statusFilter === 'ACTIVE' 
                ? 'text-foreground border-b-2 border-foreground -mb-px' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Active {activeCampaignsCount > 0 && `(${activeCampaignsCount})`}
          </button>
          <button
            onClick={() => setStatusFilter('SCHEDULED')}
            className={`pb-2 text-sm transition-colors ${
              statusFilter === 'SCHEDULED' 
                ? 'text-foreground border-b-2 border-foreground -mb-px' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Scheduled {scheduledCampaignsCount > 0 && `(${scheduledCampaignsCount})`}
          </button>
          <button
            onClick={() => setStatusFilter('PAUSED')}
            className={`pb-2 text-sm transition-colors ${
              statusFilter === 'PAUSED' 
                ? 'text-foreground border-b-2 border-foreground -mb-px' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Paused {pausedCampaignsCount > 0 && `(${pausedCampaignsCount})`}
          </button>
          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`pb-2 text-sm transition-colors ${
              statusFilter === 'COMPLETED' 
                ? 'text-foreground border-b-2 border-foreground -mb-px' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Completed {completedCampaignsCount > 0 && `(${completedCampaignsCount})`}
          </button>
          <button
            onClick={() => setStatusFilter('DRAFT')}
            className={`pb-2 text-sm transition-colors ${
              statusFilter === 'DRAFT' 
                ? 'text-foreground border-b-2 border-foreground -mb-px' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Draft {draftCampaignsCount > 0 && `(${draftCampaignsCount})`}
          </button>
          {cancelledCampaignsCount > 0 && (
            <button
              onClick={() => setStatusFilter('CANCELLED')}
              className={`pb-2 text-sm transition-colors ${
                statusFilter === 'CANCELLED' 
                  ? 'text-foreground border-b-2 border-foreground -mb-px' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Cancelled ({cancelledCampaignsCount})
            </button>
          )}
          {testCampaignsCount > 0 && (
            <button
              onClick={() => setStatusFilter('TEST')}
              className={`pb-2 text-sm transition-colors ${
                statusFilter === 'TEST' 
                  ? 'text-foreground border-b-2 border-foreground -mb-px' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Test ({testCampaignsCount})
            </button>
          )}
          {archivedCampaignsCount > 0 && (
            <button
              onClick={() => setStatusFilter('ARCHIVED')}
              className={`pb-2 text-sm transition-colors ${
                statusFilter === 'ARCHIVED' 
                  ? 'text-foreground border-b-2 border-foreground -mb-px' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Archived ({archivedCampaignsCount})
            </button>
          )}
        </div>

        {/* Campaigns List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {statusFilter === 'all' ? 'All Campaigns' : 
               statusFilter === 'ACTIVE' ? 'Active Campaigns' :
               statusFilter === 'SCHEDULED' ? 'Scheduled Campaigns' :
               statusFilter === 'PAUSED' ? 'Paused Campaigns' :
               statusFilter === 'COMPLETED' ? 'Completed Campaigns' :
               statusFilter === 'CANCELLED' ? 'Cancelled Campaigns' :
               statusFilter === 'ARCHIVED' ? 'Archived Campaigns' :
               statusFilter === 'TEST' ? 'Test Campaigns' :
               'Draft Campaigns'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredCampaigns.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {statusFilter === 'all' ? 'No campaigns yet.' :
                     statusFilter === 'COMPLETED' ? 'No completed campaigns.' :
                     statusFilter === 'ACTIVE' ? 'No active campaigns.' :
                     statusFilter === 'SCHEDULED' ? 'No scheduled campaigns.' :
                     statusFilter === 'PAUSED' ? 'No paused campaigns.' :
                     statusFilter === 'CANCELLED' ? 'No cancelled campaigns.' :
                     statusFilter === 'ARCHIVED' ? 'No archived campaigns.' :
                     statusFilter === 'TEST' ? 'No test campaigns.' :
                     'No draft campaigns.'}
                  </p>
                </div>
              ) : (
                filteredCampaigns.map((campaign) => {
                  const progressPercentage = campaign.budget > 0 ? Math.min((campaign.spent / campaign.budget) * 100, 100) : 0
                  
                  return (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group relative overflow-hidden rounded-xl border bg-card hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex">
                        {/* Campaign Image */}
                        <div className={`relative w-32 h-32 flex-shrink-0 ${campaign.hidden ? 'opacity-50' : ''}`}>
                          {campaign.featuredImage ? (
                            <img
                              src={campaign.featuredImage}
                              alt={campaign.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                              <Target className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          {/* Status Badge Overlay */}
                          <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[90%]">
                            <Badge className={getStatusColor(campaign.status)}>
                              {campaign.deletedAt ? 'ARCHIVED' : campaign.status}
                            </Badge>
                            {campaign.isTest && (
                              <Badge className="bg-foreground/60 text-background text-[10px]">
                                TEST
                              </Badge>
                            )}
                            {campaign.hidden && !campaign.deletedAt && (
                              <Badge className="bg-foreground/80 text-background">
                                <EyeOff className="w-3 h-3" />
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Campaign Content */}
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                                {campaign.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {campaign.description}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                by {campaign.creator}
                              </p>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 ml-4">
                              <button
                                onClick={async () => {
                                  const newExpanded = new Set(expandedCampaigns)
                                  if (newExpanded.has(campaign.id)) {
                                    newExpanded.delete(campaign.id)
                                    setExpandedCampaigns(newExpanded)
                                  } else {
                                    newExpanded.add(campaign.id)
                                    setExpandedCampaigns(newExpanded)
                                    
                                    // Fetch full campaign details if not already loaded
                                    if (!expandedCampaignData[campaign.id]) {
                                      const newLoading = new Set(loadingCampaignData)
                                      newLoading.add(campaign.id)
                                      setLoadingCampaignData(newLoading)
                                      
                                      try {
                                        const response = await authenticatedFetch(`/api/admin/campaigns/${campaign.id}`)
                                        if (response.ok) {
                                          const fullCampaign = await response.json()
                                          setExpandedCampaignData(prev => ({
                                            ...prev,
                                            [campaign.id]: fullCampaign
                                          }))
                                        }
                                      } catch (error) {
                                        console.error('Error fetching campaign details:', error)
                                      } finally {
                                        const updatedLoading = new Set(loadingCampaignData)
                                        updatedLoading.delete(campaign.id)
                                        setLoadingCampaignData(updatedLoading)
                                      }
                                    }
                                  }
                                }}
                                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                                title="View details"
                              >
                                {expandedCampaigns.has(campaign.id) ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleEditCampaign(campaign)}
                                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                                title="Edit campaign"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              {!campaign.deletedAt && (
                                <button
                                  onClick={() => handleToggleHidden(campaign.id, campaign.hidden || false)}
                                  className={`p-2 transition-colors ${campaign.hidden ? 'text-foreground hover:text-muted-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                  title={campaign.hidden ? "Hidden from clippers - click to show" : "Visible to clippers - click to hide"}
                                >
                                  {campaign.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              )}
                              {!campaign.deletedAt && (
                                <button
                                  onClick={() => handleToggleTest(campaign.id, campaign.isTest || false)}
                                  className={`p-2 transition-colors ${campaign.isTest ? 'text-foreground hover:text-muted-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                  title={campaign.isTest ? "Mark as real campaign" : "Mark as test (exclude from stats)"}
                                >
                                  <FlaskConical className="h-4 w-4" />
                                </button>
                              )}
                              {campaign.deletedAt && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRestoreCampaign(campaign.id)}
                                  className="ml-1"
                                >
                                  <ArchiveRestore className="h-4 w-4 mr-1" />
                                  Restore
                                </Button>
                              )}
                              {campaign.status === "DRAFT" && (
                                <Button
                                  size="sm"
                                  onClick={() => handlePublishCampaign(campaign.id)}
                                  className="ml-1"
                                >
                                  Publish
                                </Button>
                              )}
                              {campaign.status === "SCHEDULED" && (
                                <Button
                                  size="sm"
                                  onClick={() => handlePublishCampaign(campaign.id)}
                                  className="ml-1"
                                >
                                  Go Live Now
                                </Button>
                              )}
                              {campaign.status === "ACTIVE" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePauseCampaign(campaign.id)}
                                  className="ml-1"
                                >
                                  Pause
                                </Button>
                              )}
                              {campaign.status === "PAUSED" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleResumeCampaign(campaign.id)}
                                  className="ml-1"
                                >
                                  Resume
                                </Button>
                              )}
                              {campaign.status === "ACTIVE" && progressPercentage >= 50 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCompleteCampaign(campaign.id)}
                                  className="ml-1"
                                >
                                  Complete
                                </Button>
                              )}
                              {campaign.status === "COMPLETED" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReactivateCampaign(campaign.id)}
                                  className="ml-1"
                                >
                                  Reactivate
                                </Button>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button
                                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                                    title={campaign.deletedAt ? "Permanently delete" : "Archive campaign"}
                                  >
                                    {campaign.deletedAt ? <Trash2 className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {campaign.deletedAt ? 'Permanently Delete Campaign' : 'Archive Campaign'}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="space-y-2">
                                      {campaign.deletedAt ? (
                                        <>
                                          <p>Permanently delete &quot;{campaign.title}&quot; and ALL its data?</p>
                                          <p className="font-medium">This action cannot be undone. All submissions and earnings data will be lost.</p>
                                        </>
                                      ) : (
                                        <>
                                          <p>Archive &quot;{campaign.title}&quot;?</p>
                                          <p>The campaign will be hidden but all data (submissions, earnings, view tracking) will be preserved for historical records.</p>
                                          {campaign._count.clipSubmissions > 0 && (
                                            <p className="text-sm">This campaign has {campaign._count.clipSubmissions} submission(s).</p>
                                          )}
                                        </>
                                      )}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    {campaign.deletedAt ? (
                                      <AlertDialogAction
                                        onClick={() => handlePermanentDelete(campaign.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Permanently Delete
                                      </AlertDialogAction>
                                    ) : (
                                      <AlertDialogAction
                                        onClick={() => handleDeleteCampaign(campaign.id, campaign.isTest)}
                                      >
                                        Archive
                                      </AlertDialogAction>
                                    )}
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>

                          {/* Budget Progress Bar */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                              <span className="font-medium">Budget Progress</span>
                              <span className="font-medium">${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()} ({progressPercentage.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-3">
                              <div
                                className="h-3 rounded-full transition-all duration-500 bg-foreground/70"
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                          </div>

                          {/* Campaign Stats */}
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Budget</p>
                              <p className="font-medium">${campaign.budget.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Spent</p>
                              <p className="font-medium">${campaign.spent.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Remaining</p>
                              <p className="font-medium">${(campaign.budget - campaign.spent).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Submissions</p>
                              <p className="font-medium">{campaign._count.clipSubmissions}</p>
                            </div>
                          </div>

                          {/* Platform Tags */}
                          <div className="flex gap-1 mt-3">
                            {campaign.targetPlatforms.slice(0, 3).map((platform) => (
                              <Badge key={platform} variant="secondary" className="text-xs">
                                {platform}
                              </Badge>
                            ))}
                            {campaign.targetPlatforms.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{campaign.targetPlatforms.length - 3} more
                              </Badge>
                            )}
                          </div>

                          {/* Expandable Details */}
                          {expandedCampaigns.has(campaign.id) && (
                            <div className="mt-4 pt-4 border-t border-border space-y-4">
                              {loadingCampaignData.has(campaign.id) ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                              ) : (
                                <>
                                  {/* Description */}
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                                    <p className="text-sm">{campaign.description}</p>
                                  </div>

                                  {/* Stats from expanded data */}
                                  {expandedCampaignData[campaign.id]?.stats && (
                                    <div className="grid grid-cols-4 gap-3">
                                      <div className="text-center p-2 bg-muted/50 rounded-lg">
                                        <p className="text-lg font-bold">{expandedCampaignData[campaign.id].stats.totalSubmissions || 0}</p>
                                        <p className="text-xs text-muted-foreground">Submissions</p>
                                      </div>
                                      <div className="text-center p-2 bg-muted/50 rounded-lg">
                                        <p className="text-lg font-bold">{expandedCampaignData[campaign.id].stats.approvedCount || 0}</p>
                                        <p className="text-xs text-muted-foreground">Approved</p>
                                      </div>
                                      <div className="text-center p-2 bg-muted/50 rounded-lg">
                                        <p className="text-lg font-bold">{expandedCampaignData[campaign.id].stats.totalViews?.toLocaleString() || 0}</p>
                                        <p className="text-xs text-muted-foreground">Views</p>
                                      </div>
                                      <div className="text-center p-2 bg-muted/50 rounded-lg">
                                        <p className="text-lg font-bold">${expandedCampaignData[campaign.id].stats.totalEarnings?.toFixed(2) || '0.00'}</p>
                                        <p className="text-xs text-muted-foreground">Earnings</p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Submissions List */}
                                  {expandedCampaignData[campaign.id]?.clipSubmissions && expandedCampaignData[campaign.id].clipSubmissions.length > 0 && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-2">
                                        Submissions ({expandedCampaignData[campaign.id].clipSubmissions.length})
                                      </p>
                                      <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {expandedCampaignData[campaign.id].clipSubmissions.map((sub: any) => (
                                          <div key={sub.id} className="p-2 rounded-lg border bg-muted/30 text-sm">
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                                                    {sub.platform === 'YOUTUBE' ? 'YouTube' : 
                                                     sub.platform === 'TIKTOK' ? 'TikTok' :
                                                     sub.platform === 'INSTAGRAM' ? 'Instagram' :
                                                     sub.platform === 'TWITTER' ? 'X' :
                                                     sub.platform}
                                                  </Badge>
                                                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                                                    {sub.status}
                                                  </Badge>
                                                </div>
                                                <p className="font-medium text-xs">{sub.user?.name || sub.user?.email || 'Unknown'}</p>
                                                <a 
                                                  href={sub.clipUrl} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className="text-xs text-blue-500 hover:text-blue-700 truncate block"
                                                >
                                                  {sub.clipUrl?.length > 50 ? `${sub.clipUrl.substring(0, 50)}...` : sub.clipUrl}
                                                </a>
                                              </div>
                                              <div className="text-right flex-shrink-0">
                                                <p className="font-bold text-xs">${sub.earnings?.toFixed(2) || '0.00'}</p>
                                                <p className="text-xs text-muted-foreground">{sub.currentViews?.toLocaleString() || 0} views</p>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Requirements */}
                                  {campaign.requirements && campaign.requirements.length > 0 && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Requirements</p>
                                      <ul className="text-sm list-disc list-inside space-y-0.5">
                                        {campaign.requirements.map((req, idx) => (
                                          <li key={idx}>{req}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Payout Rate & Created */}
                                  <div className="flex gap-6 text-sm">
                                    <div>
                                      <p className="text-xs text-muted-foreground">Payout Rate</p>
                                      <p className="font-medium">${campaign.payoutRate}/1K views</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Created</p>
                                      <p className="font-medium">{new Date(campaign.createdAt).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
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
                      <span className="font-medium">Submissions:</span> {selectedCampaign._count.clipSubmissions}
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
                    <p className="text-muted-foreground text-sm">
                      {selectedCampaign._count?.clipSubmissions || 0} submissions total
                    </p>
                        </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* View Campaign Dialog */}
        {showViewDialog && selectedCampaign && (
          <Dialog 
            open={showViewDialog} 
            onOpenChange={(open) => {
              setShowViewDialog(open)
              if (!open) {
                // Clear selected campaign when dialog closes to prevent glitches
                setTimeout(() => setSelectedCampaign(null), 150)
              }
            }}
          >
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Campaign Details</DialogTitle>
              </DialogHeader>
              <CampaignView 
                campaign={selectedCampaign} 
                onClose={() => {
                  setShowViewDialog(false)
                  setTimeout(() => setSelectedCampaign(null), 150)
                }}
                onEdit={() => {
                  setShowViewDialog(false)
                  setTimeout(() => setSelectedCampaign(null), 150)
                  handleEditCampaign(selectedCampaign)
                }}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Campaign Form */}
        {showEditDialog && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Edit Campaign</CardTitle>
            </CardHeader>
            <CardContent>
              <CampaignForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleUpdateCampaign}
                onCancel={() => setShowEditDialog(false)}
                isEdit={true}
                isSubmitting={isUpdating}
                uploadedFile={uploadedFile}
                setUploadedFile={setUploadedFile}
              />
            </CardContent>
          </Card>
        )}
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
  isEdit = false,
  isSubmitting = false,
  uploadedFile,
  setUploadedFile
}: {
  formData: any
  setFormData: (data: any) => void
  onSubmit: () => void
  onCancel: () => void
  isEdit?: boolean
  isSubmitting?: boolean
  uploadedFile?: File | null
  setUploadedFile?: (file: File | null) => void
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔘 FORM SUBMITTED - Starting submission')
    console.log('📋 Form data:', formData)
    console.log('🎯 Platforms:', formData.targetPlatforms)
    
    // Basic validation
    if (!formData.title?.trim()) {
      console.log('❌ Missing title')
      toast.error('Campaign title is required')
      return
    }
    if (!formData.creator?.trim()) {
      console.log('❌ Missing creator')
      toast.error('Creator name is required')
      return
    }
    if (!formData.description?.trim()) {
      console.log('❌ Missing description')
      toast.error('Description is required')
      return
    }
    if (!formData.budget || isNaN(parseFloat(formData.budget)) || parseFloat(formData.budget) <= 0) {
      console.log('❌ Invalid budget')
      toast.error('Budget must be a positive number')
      return
    }
    if (!formData.payoutRate || isNaN(parseFloat(formData.payoutRate)) || parseFloat(formData.payoutRate) <= 0) {
      console.log('❌ Invalid payout rate')
      toast.error('Payout rate must be a positive number')
      return
    }
    if (!formData.targetPlatforms?.length) {
      console.log('❌ No platforms selected')
      toast.error('At least one platform must be selected')
      return
    }
    
    console.log('✅ Validation passed, calling onSubmit')
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-medium">Campaign Information</legend>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="campaign-title" className="block text-sm font-medium mb-1">
              Campaign Title *
            </label>
            <Input
              id="campaign-title"
              name="title"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter campaign title"
              required
              aria-required="true"
            />
          </div>
          
          <div>
            <label htmlFor="campaign-creator" className="block text-sm font-medium mb-1">
              Brand/Creator Name *
            </label>
            <Input
              id="campaign-creator"
              name="creator"
              value={formData.creator || ''}
              onChange={(e) => setFormData({ ...formData, creator: e.target.value })}
              placeholder="Enter brand name"
              required
              aria-required="true"
            />
          </div>
        </div>

        <div>
          <label htmlFor="campaign-description" className="block text-sm font-medium mb-1">
            Description *
          </label>
          <Textarea
            id="campaign-description"
            name="description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your campaign..."
            rows={3}
            required
            aria-required="true"
          />
        </div>

        {/* Image Upload */}
        {setUploadedFile && (
          <div>
            <FileUpload
              label="Campaign Image (Optional)"
              accept="image/*"
              maxSize={5}
              onFileChange={setUploadedFile}
              uploadedFile={uploadedFile || null}
            />
            {formData.featuredImage && !uploadedFile && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">Current Image:</p>
                <img
                  src={formData.featuredImage} 
                  alt="Current campaign image" 
                  className="w-32 h-20 object-cover rounded border"
                />
              </div>
            )}
          </div>
        )}
      </fieldset>

      {/* Budget */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-medium">Budget & Payouts</legend>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="campaign-budget" className="block text-sm font-medium mb-1">
              Total Budget ($) *
            </label>
            <Input
              id="campaign-budget"
              name="budget"
              type="number"
              min="1"
              step="1"
              value={formData.budget || ''}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="1000"
              required
              aria-required="true"
            />
          </div>
          
          <div>
            <label htmlFor="campaign-payout" className="block text-sm font-medium mb-1">
              Payout Rate per 1K Views ($) *
            </label>
            <Input
              id="campaign-payout"
              name="payoutRate"
              type="number"
              min="0.01"
              step="0.01"
              value={formData.payoutRate || ''}
              onChange={(e) => setFormData({ ...formData, payoutRate: e.target.value })}
              placeholder="2.50"
              required
              aria-required="true"
            />
          </div>
        </div>
      </fieldset>

      {/* Platforms */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-medium">Target Platforms *</legend>
        
        <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="platforms-legend">
          {platformOptions.map((platform) => (
            <div key={platform.value} className="flex items-center space-x-2">
              <input
                id={`platform-${platform.value}`}
                name="targetPlatforms"
                type="checkbox"
                value={platform.value}
                checked={formData.targetPlatforms?.includes(platform.value) || false}
                onChange={(e) => {
                  const platforms = e.target.checked
                    ? [...(formData.targetPlatforms || []), platform.value]
                    : (formData.targetPlatforms || []).filter((p: string) => p !== platform.value)
                  setFormData({ ...formData, targetPlatforms: platforms })
                }}
                className="rounded"
                aria-required="true"
              />
              <label htmlFor={`platform-${platform.value}`} className="text-sm">
                {platform.label}
              </label>
            </div>
          ))}
        </div>
      </fieldset>

      {/* Requirements */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-medium">Content Requirements</legend>
        <div>
          <label htmlFor="campaign-requirements" className="block text-sm font-medium mb-1">
            Requirements (Optional)
          </label>
          <Textarea
            id="campaign-requirements"
            name="requirements"
            value={formData.requirements?.join('\n') || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              requirements: e.target.value.split('\n').filter(r => r.trim()) 
            })}
            placeholder="Enter requirements (one per line)"
            rows={3}
          />
        </div>
      </fieldset>

      {/* Status */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-medium">Campaign Status</legend>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="campaign-status" className="block text-sm font-medium mb-1">
              Status
            </label>
            <Select 
              value={formData.status || 'ACTIVE'} 
              onValueChange={(value) => setFormData({ ...formData, status: value })}
              name="status"
            >
              <SelectTrigger id="campaign-status" aria-label="Campaign Status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled (goes live at start date)</SelectItem>
                <SelectItem value="ACTIVE">Active (live now)</SelectItem>
                <SelectItem value="PAUSED">Paused (temporarily hidden)</SelectItem>
                {/* Show CANCELLED option only when editing an existing campaign */}
                {isEdit && (
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {formData.status === 'PAUSED' && 'Campaign is temporarily paused. Clippers cannot submit but existing submissions continue earning.'}
              {formData.status === 'CANCELLED' && 'Campaign is cancelled. No new submissions or earnings.'}
            </p>
          </div>
          
          {formData.status === 'SCHEDULED' && (
            <div>
              <label htmlFor="campaign-startDate" className="block text-sm font-medium mb-1">
                Launch Date & Time * <span className="text-muted-foreground font-normal">({Intl.DateTimeFormat().resolvedOptions().timeZone})</span>
              </label>
              <Input
                id="campaign-startDate"
                name="startDate"
                type="datetime-local"
                value={formData.startDate || ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required={formData.status === 'SCHEDULED'}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Campaign will automatically go live at this time (your local timezone)
              </p>
            </div>
          )}
        </div>
      </fieldset>

      {/* Buttons */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEdit ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>{isEdit ? "Update" : "Create"} Campaign</>
          )}
        </Button>
      </div>
    </form>
  )
}

// Campaign View Component with full submission details
function CampaignView({
  campaign,
  onClose,
  onEdit
}: {
  campaign: any // Using any since it now includes stats and clipSubmissions
  onClose: () => void
  onEdit: () => void
}) {
  const [showAllSubmissions, setShowAllSubmissions] = useState(false)
  const submissions = campaign.clipSubmissions || []
  const stats = campaign.stats || {}
  const displayedSubmissions = showAllSubmissions ? submissions : submissions.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Campaign Image */}
      {campaign.featuredImage && (
        <div className="relative h-48 bg-muted rounded-lg overflow-hidden">
          <img
            src={campaign.featuredImage}
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Campaign Title</Label>
          <p className="text-lg font-medium">{campaign.title}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Creator/Brand</Label>
          <p className="text-lg">{campaign.creator}</p>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-muted-foreground">Description</Label>
        <p className="mt-1 text-sm leading-relaxed">{campaign.description}</p>
      </div>

      {/* Budget & Performance Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Budget</p>
          <p className="text-xl font-bold">${Number(campaign.budget).toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Spent</p>
          <p className="text-xl font-bold">${Number(campaign.spent).toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Earnings</p>
          <p className="text-xl font-bold">${stats.totalEarnings?.toFixed(2) || '0.00'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Views</p>
          <p className="text-xl font-bold">{stats.totalViews?.toLocaleString() || 0}</p>
        </Card>
      </div>

      {/* Submission Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center p-3 bg-muted rounded-lg border">
          <p className="text-2xl font-bold">{stats.totalSubmissions || 0}</p>
          <p className="text-xs text-muted-foreground">Total Submissions</p>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg border">
          <p className="text-2xl font-bold">{stats.approvedCount || 0}</p>
          <p className="text-xs text-muted-foreground">Approved</p>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg border">
          <p className="text-2xl font-bold">{stats.pendingCount || 0}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg border">
          <p className="text-2xl font-bold">{stats.rejectedCount || 0}</p>
          <p className="text-xs text-muted-foreground">Rejected</p>
        </div>
      </div>

      {/* Status & Completion Info */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Status</Label>
          <Badge variant="outline" className="mt-1">
            {campaign.status}
          </Badge>
          {campaign.completedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Completed: {new Date(campaign.completedAt).toLocaleDateString()}
            </p>
          )}
          {campaign.completionReason && (
            <p className="text-xs text-muted-foreground mt-1">
              Reason: {campaign.completionReason}
            </p>
          )}
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Budget Utilization</Label>
          <div className="mt-2">
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="h-3 rounded-full bg-foreground/70"
                style={{ width: `${Math.min(stats.budgetUtilization || 0, 100)}%` }}
              />
            </div>
            <p className="text-sm mt-1">{(stats.budgetUtilization || 0).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Platforms */}
      <div>
        <Label className="text-sm font-medium text-muted-foreground">Target Platforms</Label>
        <div className="flex gap-2 mt-2">
          {campaign.targetPlatforms.map((platform: string) => (
            <Badge key={platform} variant="secondary">
              {platform}
            </Badge>
          ))}
        </div>
      </div>

      {/* Submissions List */}
      {submissions.length > 0 && (
        <div>
          <Label className="text-sm font-medium text-muted-foreground mb-3 block">
            Submissions ({submissions.length})
          </Label>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {displayedSubmissions.map((sub: any) => (
              <div key={sub.id} className="p-3 rounded-lg border bg-muted/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {sub.platform === 'YOUTUBE' ? 'YouTube' : 
                         sub.platform === 'TIKTOK' ? 'TikTok' :
                         sub.platform === 'INSTAGRAM' ? 'Instagram' :
                         sub.platform === 'TWITTER' ? 'X' :
                         sub.platform}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {sub.status}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm">{sub.user?.name || sub.user?.email || 'Unknown'}</p>
                    <a 
                      href={sub.clipUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:text-blue-700 truncate block"
                    >
                      {sub.clipUrl?.length > 50 ? `${sub.clipUrl.substring(0, 50)}...` : sub.clipUrl}
                    </a>
                    {sub.user?.paypalEmail && (
                      <p className="text-xs text-muted-foreground mt-1">PayPal: {sub.user.paypalEmail}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold">${sub.earnings?.toFixed(2) || '0.00'}</p>
                    <p className="text-xs text-muted-foreground">{sub.currentViews?.toLocaleString() || 0} views</p>
                    <p className="text-xs text-muted-foreground">+{sub.viewsGained?.toLocaleString() || 0} gained</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {submissions.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2"
              onClick={() => setShowAllSubmissions(!showAllSubmissions)}
            >
              {showAllSubmissions ? 'Show Less' : `Show All ${submissions.length} Submissions`}
            </Button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Campaign
        </Button>
      </div>
    </div>
  )
}

// Force this page to be dynamic (not statically generated)
export const dynamic = 'force-dynamic'
