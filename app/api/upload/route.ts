import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client for storage
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log("📤 Upload API called")

    // Check environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error("❌ NEXT_PUBLIC_SUPABASE_URL not set")
      return NextResponse.json({ error: "Supabase URL not configured" }, { status: 500 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ SUPABASE_SERVICE_ROLE_KEY not set")
      return NextResponse.json({ error: "Supabase service key not configured" }, { status: 500 })
    }

    // Simplified auth check for upload API
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error("❌ No valid authorization header")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ Authorization header present")

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
