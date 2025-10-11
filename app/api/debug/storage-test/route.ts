import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Testing Supabase Storage connection...")

    // List buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.error("❌ Failed to list buckets:", bucketsError)
      return NextResponse.json({
        error: "Failed to list buckets",
        details: bucketsError.message
      }, { status: 500 })
    }

    console.log("✅ Buckets found:", buckets?.length || 0)

    // Check if 'images' bucket exists
    const imagesBucket = buckets?.find(b => b.name === 'images')

    if (!imagesBucket) {
      console.error("❌ 'images' bucket not found")
      return NextResponse.json({
        error: "Storage bucket 'images' not found",
        availableBuckets: buckets?.map(b => b.name) || []
      }, { status: 404 })
    }

    console.log("✅ 'images' bucket exists:", imagesBucket)

    // Test upload permissions by trying to get public URL for a test file
    const testPath = 'test-upload.txt'
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(testPath)

    console.log("✅ Public URL generation works:", publicUrl)

    return NextResponse.json({
      success: true,
      buckets: buckets?.map(b => ({ name: b.name, created_at: b.created_at })) || [],
      imagesBucket,
      testPublicUrl: publicUrl,
      message: "Supabase Storage is working correctly"
    })

  } catch (error) {
    console.error("❌ Storage test error:", error)
    return NextResponse.json({
      error: "Storage test failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
