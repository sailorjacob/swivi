import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { getServerUserWithRole } from "@/lib/supabase-auth-server"

// Server-side Supabase client for storage (only if configured)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export async function POST(request: NextRequest) {
  try {
    console.log("📤 Upload API called")

    // Check if Supabase is configured
    if (!supabase) {
      console.error("❌ Supabase not configured")
      return NextResponse.json({
        error: "Supabase not configured",
        message: "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required"
      }, { status: 500 })
    }


    // Use proper authentication check
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      console.error("❌ Upload authentication failed:", error?.message)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ Upload authenticated for user:", user.id)

    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string || 'images'

    console.log("📎 Upload request:", {
      hasFile: !!file,
      bucket,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type
    })

    if (!file) {
      console.error("❌ No file provided in upload request")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      console.error("❌ File too large:", file.size, "bytes")
      return NextResponse.json({ error: "File too large. Maximum size is 10MB" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      console.error("❌ Invalid file type:", file.type)
      return NextResponse.json({
        error: "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed"
      }, { status: 400 })
    }

    // Generate unique filename with proper extension handling
    const fileNameParts = file.name.split('.')
    const fileExt = fileNameParts.length > 1 ? fileNameParts.pop() : 'bin'
    const baseName = fileNameParts.join('.') || 'file'

    // Ensure extension is valid
    const validExt = fileExt && fileExt.length <= 10 ? fileExt : 'bin'
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2)}`

    const fileName = `${uniqueName}.${validExt}`
    const filePath = `campaigns/${fileName}`

    console.log("📁 Generated file path:", filePath)

    // Check if bucket exists and is accessible
    console.log("🔍 Checking bucket access...")
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error("❌ Failed to list buckets:", bucketsError)
      return NextResponse.json({
        error: "Storage configuration error",
        details: bucketsError.message
      }, { status: 500 })
    }

    const bucketExists = buckets?.some(b => b.name === bucket)
    if (!bucketExists) {
      console.error("❌ Bucket does not exist:", bucket)
      return NextResponse.json({
        error: `Storage bucket '${bucket}' does not exist`,
        availableBuckets: buckets?.map(b => b.name) || []
      }, { status: 404 })
    }

    console.log("✅ Bucket exists and is accessible")

    // Upload to Supabase Storage
    console.log("🚀 Starting upload to Supabase Storage...")
    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error("❌ Upload error:", uploadError)
      return NextResponse.json({
        error: "Upload failed",
        details: uploadError.message,
        filePath,
        bucket
      }, { status: 500 })
    }

    console.log("✅ Upload successful, path:", data.path)

    // Get public URL
    console.log("🔗 Getting public URL...")
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    console.log("✅ Public URL generated:", publicUrl)

    return NextResponse.json({
      url: publicUrl,
      path: data.path,
      bucket,
      fileName: file.name,
      fileSize: file.size
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
