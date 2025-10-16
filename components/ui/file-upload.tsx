"use client"

import { useState, useRef } from "react"
import { Upload, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  label?: string
  accept?: string
  maxSize?: number // in MB
  onFileChange: (file: File | null) => void
  uploadedFile: File | null
  error?: string
  className?: string
}

export function FileUpload({
  label = "Upload file",
  accept = "image/*,video/*",
  maxSize = 50,
  onFileChange,
  uploadedFile,
  error,
  className
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      const file = e.dataTransfer.files[0]
      if (validateFile(file)) {
        onFileChange(file)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (validateFile(file)) {
        onFileChange(file)
      }
    }
  }

  const validateFile = (file: File): boolean => {
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`)
      return false
    }
    return true
  }

  const removeFile = () => {
    onFileChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const inputId = `file-upload-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-foreground">{label}</label>}

      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
          dragActive
            ? "border-foreground bg-muted"
            : "border-border hover:border-muted-foreground",
          uploadedFile && "border-green-500 bg-green-50"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploadedFile ? (
          <div className="space-y-3">
            <div className="text-green-600">
              <Upload className="w-8 h-8 mx-auto mb-2" />
              <p className="font-medium">{uploadedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                removeFile()
              }}
              className="border-green-500 text-green-600 hover:bg-green-100"
            >
              <X className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-muted-foreground">
              <Upload className="w-8 h-8 mx-auto mb-2" />
              <p className="font-medium">Click to upload or drag and drop</p>
              <p className="text-sm">
                {accept.includes("image") && accept.includes("video")
                  ? "Images and videos up to"
                  : accept.includes("image")
                  ? "Images up to"
                  : "Videos up to"} {maxSize}MB
              </p>
            </div>
          </div>
        )}

        <input
          id={inputId}
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
        />
      </div>

      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
