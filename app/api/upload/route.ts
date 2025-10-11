import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client for storage
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log("📤 Upload API called")

    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      console.error("❌ Upload auth failed:", { user: !!user, error: error?.message })
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ Upload auth successful for user:", user.id)

    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string || 'images'

    console.log("📎 Upload request:", { hasFile: !!file, bucket, fileName: file?.name, fileSize: file?.size })

    if (!file) {
      console.error("❌ No file provided in upload request")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `campaigns/${fileName}`

    console.log("📁 Generated file path:", filePath)

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
      return NextResponse.json({ error: "Upload failed", details: uploadError.message }, { status: 500 })
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
      path: data.path
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
