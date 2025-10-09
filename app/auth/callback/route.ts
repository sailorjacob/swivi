import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/clippers/dashboard'

  console.log('🔄 OAuth callback received:', {
    hasCode: !!code,
    next,
    origin
  })

  if (code) {
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    try {
      console.log('🔑 Exchanging code for session...')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('❌ OAuth callback error:', error.message)
        return NextResponse.redirect(`${origin}/clippers/login?error=oauth_error`)
      }

      if (data.session) {
        console.log('✅ Session established for user:', data.session.user.email)
        console.log('🍪 Cookies should be set by Supabase client')
        
        return NextResponse.redirect(`${origin}${next}`)
      }
    } catch (error) {
      console.error('❌ OAuth callback exception:', error)
      return NextResponse.redirect(`${origin}/clippers/login?error=callback_error`)
    }
  }

  console.log('❌ No code in OAuth callback')
  return NextResponse.redirect(`${origin}/clippers/login?error=no_code`)
}
