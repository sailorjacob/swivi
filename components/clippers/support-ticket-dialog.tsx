"use client"

import { useState } from "react"
import { authenticatedFetch } from "@/lib/supabase-browser"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpCircle, Loader2, CheckCircle, Upload, X, ImageIcon } from "lucide-react"
import toast from "react-hot-toast"

interface SupportTicketDialogProps {
  children?: React.ReactNode
}

export function SupportTicketDialog({ children }: SupportTicketDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  
  const [formData, setFormData] = useState({
    category: "",
    subject: "",
    message: "",
    imageUrl: ""
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setUploadingImage(true)
    
    try {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to Supabase Storage (using images bucket)
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('bucket', 'images')

      const response = await authenticatedFetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      })

      if (response.ok) {
        const { url } = await response.json()
        setFormData(prev => ({ ...prev, imageUrl: url }))
        toast.success('Image uploaded')
      } else {
        // If upload fails, still keep the preview but note the URL is missing
        toast.error('Image upload failed - you can still submit without it')
      }
    } catch (error) {
      console.error('Image upload error:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    setFormData(prev => ({ ...prev, imageUrl: "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.category) {
      toast.error('Please select a category')
      return
    }
    
    if (formData.subject.length < 5) {
      toast.error('Subject must be at least 5 characters')
      return
    }
    
    if (formData.message.length < 10) {
      toast.error('Message must be at least 10 characters')
      return
    }

    setLoading(true)

    try {
      const response = await authenticatedFetch('/api/support-tickets', {
        method: 'POST',
        body: JSON.stringify({
          category: formData.category,
          subject: formData.subject,
          message: formData.message,
          imageUrl: formData.imageUrl || null
        })
      })

      if (response.ok) {
        setSuccess(true)
        toast.success('Support ticket submitted!')
        
        // Reset form after delay
        setTimeout(() => {
          setOpen(false)
          setSuccess(false)
          setFormData({ category: "", subject: "", message: "", imageUrl: "" })
          setImagePreview(null)
        }, 2000)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to submit ticket')
      }
    } catch (error) {
      console.error('Error submitting ticket:', error)
      toast.error('Failed to submit ticket')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ category: "", subject: "", message: "", imageUrl: "" })
    setImagePreview(null)
    setSuccess(false)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-foreground">
            <HelpCircle className="w-4 h-4 mr-2" />
            Support
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Submit Support Ticket</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Ticket Submitted!</h3>
            <p className="text-sm text-muted-foreground">
              We'll review your ticket and respond as soon as possible.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger id="category" className="mt-1">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VERIFICATION">Verification Issue</SelectItem>
                  <SelectItem value="PAYOUTS">Payouts</SelectItem>
                  <SelectItem value="CAMPAIGN">Campaign Question</SelectItem>
                  <SelectItem value="BONUS">Bonus Question</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Brief description of your issue"
                className="mt-1"
                maxLength={200}
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Please describe your issue in detail..."
                className="mt-1 min-h-[120px]"
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.message.length}/2000
              </p>
            </div>

            <div>
              <Label>Screenshot (optional)</Label>
              {imagePreview ? (
                <div className="mt-1 relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-32 object-cover rounded-lg border border-border"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-1">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-2 pb-2">
                      {uploadingImage ? (
                        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                      ) : (
                        <>
                          <ImageIcon className="w-6 h-6 text-muted-foreground mb-1" />
                          <p className="text-xs text-muted-foreground">Click to upload image</p>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || uploadingImage}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Ticket'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

