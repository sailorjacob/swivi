"use client"

import { useState } from "react"
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

      const response = await fetch("/api/clippers/submissions", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
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
      <DialogContent className="sm:max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create submission</DialogTitle>
        </DialogHeader>

        {/* Info Alert */}
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Only views after you submit count towards payout. Submit as soon as you post to get paid for all of your views.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Campaign Info */}
          {campaign && (
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium text-foreground">{campaign.title}</h3>
              <p className="text-sm text-muted-foreground">by {campaign.creator}</p>
              <p className="text-sm text-foreground font-medium mt-1">{campaign.payout}</p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Submit your social media post</h3>
            <p className="text-muted-foreground">
              Share your post's link and the original image or video below. Once approved, you'll start earning rewards based on the views your content generates.
            </p>
          </div>

          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url" className="text-foreground">
              Provide link <span className="text-red-500">*</span>
            </Label>
            <Input
              id="url"
              {...register("url")}
              placeholder="https://www.tiktok.com/@frankwarrinkmotivation/video/7522962756245474591"
              className="bg-input border-border text-foreground"
            />
            {errors.url && (
              <p className="text-red-500 text-sm">{String(errors.url.message)}</p>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label className="text-foreground">
              Media <span className="text-red-500">*</span>
            </Label>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
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
                  <p className="text-foreground font-medium">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setUploadedFile(null)}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-muted-foreground">
                    <p className="font-medium">
                      Upload the original media file you posted (not a screenshot). For videos, upload the video file. For posts with multiple files, upload the first file.
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
                      onClick={() => document.getElementById('file-upload')?.click()}
                      className="border-border focus:outline-none focus-visible:outline-none"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload media
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
