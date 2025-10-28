"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase-auth"
import { authenticatedFetch } from "@/lib/supabase-browser"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Upload, X, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import toast from "react-hot-toast"

const submissionSchema = z.object({
  url: z.string().url("Please enter a valid social media URL"),
  mediaFile: z.any().optional(),
})

interface ClipSubmissionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign?: {
    id: string
    title: string
    creator: string
    payout: string
  }
}

export function ClipSubmissionModal({ open, onOpenChange, campaign }: ClipSubmissionModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(submissionSchema),
  })

  const onSubmit = async (data: any) => {
    setIsLoading(true)
    
    try {
      const submissionData = {
        campaignId: campaign?.id,
        clipUrl: data.url, // Fix: use 'url' from form data
        platform: "TIKTOK", // Fix: provide default platform or get from form
        // mediaFileUrl would be set after file upload to Supabase
        mediaFileUrl: uploadedFile ? "pending_upload" : undefined,
      }

      const response = await authenticatedFetch("/api/clippers/submissions", {
        method: "POST",
        body: JSON.stringify(submissionData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit clip")
      }

      const result = await response.json()
      toast.success("Clip submitted successfully! You'll be notified once it's reviewed.")
      reset()
      setUploadedFile(null)
      onOpenChange(false)
    } catch (error) {
      console.error("Submission error:", error)
      toast.error("Failed to submit clip. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-lg font-medium text-foreground">Create submission</DialogTitle>
        </DialogHeader>

        {/* Info Alert */}
        <Alert className="bg-muted/50 border-border">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <AlertDescription className="text-muted-foreground text-sm">
            Only views after you submit count towards payout. Submit as soon as you post to get paid for all views.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Campaign Info */}
          {campaign && (
            <div className="border border-border rounded-lg p-3">
              <h3 className="text-sm font-medium text-foreground">{campaign.title}</h3>
              <p className="text-xs text-muted-foreground">by {campaign.creator}</p>
              <p className="text-xs text-foreground font-medium mt-1">{campaign.payout}</p>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-base font-medium text-foreground">Submit your social media post</h3>
            <p className="text-sm text-muted-foreground">
              Share your post's link and original media. Once approved, you'll earn based on views generated.
            </p>
          </div>

          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url" className="text-sm text-foreground">
              Provide link <span className="text-destructive">*</span>
            </Label>
            <Input
              id="url"
              {...register("url")}
              placeholder="https://www.tiktok.com/@username/video/123456789"
              className="h-9 text-sm"
            />
            {errors.url && (
              <p className="text-destructive text-xs">{String(errors.url.message)}</p>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label className="text-sm text-foreground">
              Media <span className="text-destructive">*</span>
            </Label>
            
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                dragActive 
                  ? "border-foreground bg-muted" 
                  : "border-border hover:border-muted-foreground"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {uploadedFile ? (
                <div className="space-y-2">
                  <p className="text-sm text-foreground font-medium">{uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setUploadedFile(null)}
                    className="h-8"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-muted-foreground">
                    <p className="text-sm">
                      Upload the original media file (not a screenshot). For videos, upload the video file.
                    </p>
                  </div>
                  
                  <div>
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept="video/*,image/*"
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      className="h-8"
                    >
                      <Upload className="w-3 h-3 mr-2" />
                      Upload media
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-9"
              size="sm"
            >
              {isLoading ? "Submitting..." : "Submit"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              size="sm"
              className="h-9"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
