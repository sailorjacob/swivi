# Comprehensive Supabase Auth Setup Guide

This guide explains how to properly set up Supabase Auth with Discord and Google OAuth from scratch, ensuring complete compatibility between your database schema and authentication implementation.

## Database Schema Overview

Your Prisma schema correctly defines:

```prisma
model User {
  id                String   @id @default(cuid())
  supabaseAuthId    String?  @unique @map("supabase_auth_id") // Links to Supabase Auth user ID
  name              String?
  email             String?   @unique @map("email")
  role              UserRole? @default(CLIPPER)
  verified          Boolean?  @default(false)
  // ... other fields

  accounts          Account[] // OAuth accounts
  clipSubmissions   ClipSubmission[] // Correct relationship name
}

model Account {
  id                String  @id @default(cuid())
  provider          String  // 'discord' or 'google'
  providerAccountId String  @map("provider_account_id")
  userId            String  @map("user_id")
  user              User    @relation(fields: [userId], references: [id])
}
```

## Supabase Configuration

### 1. Environment Variables
Ensure your `.env` file contains:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=your-database-url
```

### 2. Supabase Dashboard Setup

#### Authentication Settings
1. Go to Authentication > Settings
2. Configure Site URL:
   - **Production**: `https://www.swivimedia.com`
   - **Development**: `http://localhost:3000`

#### OAuth Providers
1. **Discord**:
   - Go to Authentication > Providers
   - Enable Discord
   - Client ID: Your Discord application client ID
   - Client Secret: Your Discord application client secret

2. **Google**:
   - Go to Authentication > Providers
   - Enable Google
   - Client ID: Your Google OAuth client ID
   - Client Secret: Your Google OAuth client secret

#### Redirect URLs
Configure redirect URLs in your OAuth provider settings:
- **Discord**: `https://your-project.supabase.co/auth/v1/callback`
- **Google**: `https://your-project.supabase.co/auth/v1/callback`

## Code Implementation

### 1. Client-side Auth (`lib/supabase-auth.ts`)
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      debug: false
    }
  }
)

// Environment-aware OAuth redirect URLs
export const signInWithDiscord = async () => {
  const redirectTo = process.env.NODE_ENV === 'production'
    ? 'https://www.swivimedia.com/clippers/dashboard'
    : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/clippers/dashboard`

  return supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: { redirectTo }
  })
}
```

### 2. Server-side Auth (`lib/supabase-auth-server.ts`)
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'

export const getServerUserWithRole = async (request?: NextRequest) => {
  try {
    let supabase

    if (request) {
      // Create client with request cookies for API routes
      const cookieStore = {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // API routes can't set cookies
        },
        remove(name: string, options: any) {
          // API routes can't remove cookies
        },
      }

      supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: cookieStore }
      )
    } else {
      // Use standard server client for non-request contexts
      supabase = createSupabaseServerClient()
    }

    const { data: { user }, error } = await supabase.auth.getUser()

    if (user && !error) {
      // Ensure user exists in our database
      await ensureUserExists(user)

      // Fetch enhanced user data
      const userData = await prisma.user.findUnique({
        where: { supabaseAuthId: user.id },
        select: {
          id: true,
          role: true,
          verified: true,
          name: true,
          email: true,
          image: true
        }
      })

      if (userData) {
        return { user: { ...user, ...userData }, error: null }
      }
    }

    return { user: null, error }
  } catch (error) {
    return { user: null, error }
  }
}
```

### 3. Auth Provider (`lib/supabase-auth-provider.tsx`)
```typescript
export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [session, setSession] = useState<SupabaseSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { user: initialUser } = await getUserWithRole()
      if (initialUser) {
        setSession({ user: initialUser } as SupabaseSession)
        setUser(initialUser)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setSession(null)
          setLoading(false)
          return
        }

        if (session?.user) {
          const { user: enhancedUser } = await getUserWithRole()
          setUser(enhancedUser)
          setSession(session as SupabaseSession)
        } else {
          setUser(null)
          setSession(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ... rest of provider
}
```

### 4. API Route Example (`app/api/clippers/dashboard/route.ts`)
```typescript
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user data from database using supabaseAuthId
    const userData = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: {
        totalViews: true,
        totalEarnings: true,
        clipSubmissions: { // Correct relationship name
          select: {
            id: true,
            status: true,
            payout: true,
            createdAt: true,
            campaign: { select: { title: true } },
            clip: { select: { title: true } }
          },
          orderBy: { createdAt: "desc" },
          take: 10
        }
      }
    })

    return NextResponse.json(userData)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
```

## Key Implementation Details

### 1. **User Creation Flow**
When a user signs in via OAuth:
1. Supabase Auth creates/updates the auth user
2. `ensureUserExists()` creates a record in your `users` table
3. The `supabaseAuthId` field links the two

### 2. **Session Management**
- **Client-side**: Uses `onAuthStateChange` to track auth state
- **Server-side**: Uses `createServerClient` with cookie store for API routes
- **Middleware**: Allows API routes to handle their own authentication

### 3. **Database Relationships**
- Use `supabaseAuthId` for user lookups (not `id`)
- Use `clipSubmissions` for submission relationships (not `submissions`)
- Use camelCase for Prisma relationships (`clipSubmissions`)

### 4. **Error Handling**
- API routes should handle authentication failures gracefully
- Database connection issues should not crash the auth flow
- Invalid sessions should redirect to login

## Testing the Setup

### 1. **Database Connection**
```bash
npx prisma db push
npx prisma generate
```

### 2. **User Migration** (if needed)
```bash
node scripts/migrate-existing-users.js
```

### 3. **Environment Check**
```bash
node scripts/env-check.js
```

### 4. **Test Authentication**
1. Clear browser cookies
2. Visit `/clippers/login`
3. Test Discord and Google login
4. Verify dashboard loads with correct user data

## Troubleshooting

### Common Issues:

1. **401 Unauthorized on API routes**
   - Check if `getServerUserWithRole` is properly reading cookies
   - Verify environment variables are loaded
   - Ensure user exists in database

2. **Blank pages after login**
   - Check database connection
   - Verify user creation flow
   - Check for database query errors

3. **OAuth redirect issues**
   - Verify redirect URLs in Supabase dashboard
   - Check environment-specific URLs in code
   - Ensure site URL matches in Supabase settings

### Debug Commands:
```bash
# Check environment variables
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"

# Test database connection
node scripts/test-db.js

# Check user creation
node scripts/debug-user-creation.js
```

This comprehensive setup ensures your Supabase Auth integration works correctly with Discord and Google OAuth, with proper database relationships and error handling.
