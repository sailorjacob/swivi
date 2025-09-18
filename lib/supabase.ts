import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Storage helpers for file uploads
export const uploadFile = async (
  bucket: string,
  fileName: string,
  file: File
): Promise<{ url: string | null; error: string | null }> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      return { url: null, error: error.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return { url: publicUrl, error: null }
  } catch (error) {
    return { url: null, error: 'Upload failed' }
  }
}

// Delete file from storage
export const deleteFile = async (
  bucket: string,
  fileName: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName])

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (error) {
    return { success: false, error: 'Delete failed' }
  }
}

// Storage buckets
export const STORAGE_BUCKETS = {
  CLIPS: 'clips',
  AVATARS: 'avatars',
  CAMPAIGN_ASSETS: 'campaign-assets',
} as const
