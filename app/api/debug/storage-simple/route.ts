import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      return NextResponse.json({
        error: "NEXT_PUBLIC_SUPABASE_URL not configured",
        envCheck: "FAILED"
      }, { status: 500 })
    }

    if (!serviceKey) {
      return NextResponse.json({
        error: "SUPABASE_SERVICE_ROLE_KEY not configured",
        envCheck: "FAILED"
      }, { status: 500 })
    }

    // Create client and test connection
    const supabase = createClient(supabaseUrl, serviceKey)

    // Test basic connection by listing buckets
    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
      return NextResponse.json({
        error: "Failed to connect to Supabase Storage",
        details: error.message,
        envCheck: "OK",
        connectionCheck: "FAILED"
      }, { status: 500 })
    }

    // Check if 'images' bucket exists
    const imagesBucket = buckets?.find(b => b.name === 'images')

    return NextResponse.json({
      success: true,
      envCheck: "OK",
      connectionCheck: "OK",
      bucketsCount: buckets?.length || 0,
      imagesBucket: imagesBucket ? {
        name: imagesBucket.name,
        created_at: imagesBucket.created_at
      } : null,
      allBuckets: buckets?.map(b => ({ name: b.name, created_at: b.created_at })) || []
    })

  } catch (error) {
    return NextResponse.json({
      error: "Unexpected error during storage check",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
