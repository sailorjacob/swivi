# 🚀 Complete Setup Guide for Swivi Authentication

## 🗄️ Step 1: Supabase Database Setup

### 1.1 Get Your Database URL
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **Database**
4. Find **Connection String** → **URI**
5. Copy the connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
   ```

### 1.2 Update Your .env File
Replace the DATABASE_URL in your .env with the one from Supabase:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"
```

### 1.3 Create Database Tables
Once your DATABASE_URL is correct, run:
```bash
# Option 1: Push schema directly (recommended for now)
npx prisma db push

# Option 2: Create migration (for production)
npx prisma migrate dev --name init
```

## 🔐 Step 2: OAuth Provider Setup

### 📘 Discord OAuth Setup

1. **Go to Discord Developer Portal**
   - Visit: https://discord.com/developers/applications
   - Click "New Application" or select existing

2. **Configure OAuth2**
   - Go to **OAuth2** → **General**
   - Add Redirects:
     ```
     https://www.swivimedia.com/api/auth/callback/discord
     http://localhost:3000/api/auth/callback/discord
     ```

3. **Get Credentials**
   - Copy **Client ID** and **Client Secret**
   - Already in your .env ✅

4. **What "Verify Callback URL" Means**
   - It means adding the URLs above to Discord's allowed redirects
   - This tells Discord where it's safe to send users after login
   - If you see these URLs in Discord settings, you're done! ✅

### 📗 Google OAuth Setup

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create new project or select existing

2. **Enable Google+ API**
   - APIs & Services → Enable APIs
   - Search for "Google+ API" → Enable

3. **Configure OAuth Consent Screen**
   - APIs & Services → OAuth consent screen
   - Choose "External" user type
   - Fill in app name, support email, etc.
   - Add scopes: email, profile

4. **Create OAuth Credentials**
   - APIs & Services → Credentials
   - Create Credentials → OAuth Client ID
   - Application type: Web application
   - Add Authorized redirect URIs:
     ```
     https://www.swivimedia.com/api/auth/callback/google
     http://localhost:3000/api/auth/callback/google
     ```

5. **Get Credentials**
   - Copy Client ID and Client Secret
   - Already in your .env ✅

## 🛠️ Step 3: Fix Missing Features

### 3.1 Create Signup Page
Create `/app/clippers/signup/page.tsx`:
```tsx
"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DiscordIcon } from "@/components/ui/icons/discord-icon"
import { GoogleIcon } from "@/components/ui/icons/google-icon"
import Link from "next/link"
import toast from "react-hot-toast"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Signup failed")
      }

      // Auto login after signup
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        throw new Error("Login failed after signup")
      }

      toast.success("Account created successfully!")
      router.push("/clippers/onboarding")
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Your Clipper Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => signIn("discord", { callbackUrl: "/clippers/onboarding" })}
            >
              <DiscordIcon className="w-4 h-4 mr-2" />
              Discord
            </Button>
            <Button
              variant="outline"
              onClick={() => signIn("google", { callbackUrl: "/clippers/onboarding" })}
            >
              <GoogleIcon className="w-4 h-4 mr-2" />
              Google
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/clippers/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 3.2 Update Login Page
Add link to signup from login page.

### 3.3 Fix Header Navigation
Update the "Become a Clipper" button to go to signup instead of Discord.

### 3.4 Improve Onboarding Logic
Update `/lib/auth.ts` to check if user is new:
```javascript
async redirect({ url, baseUrl }) {
  if (url.startsWith("/")) return `${baseUrl}${url}`
  else if (new URL(url).origin === baseUrl) return url
  
  // This will be handled by the onboarding page
  return `${baseUrl}/clippers/dashboard`
}
```

## 📊 Step 4: Verify Everything Works

### 4.1 Check Database Connection
```bash
# Test database connection
curl https://www.swivimedia.com/api/health

# Or locally
curl http://localhost:3000/api/health
```

### 4.2 View Users in Supabase
Once tables are created:
1. Go to Supabase Dashboard
2. **Table Editor** (left sidebar)
3. You should see tables: users, accounts, sessions, etc.

### 4.3 Test Authentication Flow
1. Clear browser cookies
2. Go to `/clippers/signup`
3. Try creating account with Google/Discord
4. Check Supabase tables for new user

## 🚨 Common Issues & Solutions

### "No tables in Supabase"
- Run `npx prisma db push` after fixing DATABASE_URL
- Check Supabase dashboard → Table Editor

### "OAuth callback error"
- Make sure redirect URLs are added in Discord/Google
- URLs must match EXACTLY (including https://)

### "Authentication failed against database"
- Double-check DATABASE_URL in .env
- Make sure password doesn't have unescaped special characters
- Try resetting database password in Supabase

## 💰 Costs Summary

- **Supabase**: Free tier includes 500MB database
- **Discord OAuth**: Completely free
- **Google OAuth**: Free, but needs verification for production ($15-75 one-time)
- **Vercel**: Free tier is sufficient for starting

## 🎯 Next Steps

1. Fix DATABASE_URL and create tables
2. Add OAuth redirect URLs
3. Create signup page
4. Test complete flow
5. Monitor users in Supabase dashboard
