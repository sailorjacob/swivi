import { NextAuthOptions } from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { env } from "@/lib/env"
import { conditionalConnect } from "@/lib/db-retry"

// Custom adapter that handles database connection issues gracefully
const createSafeAdapter = () => {
  try {
    // Test database connection first
    conditionalConnect().then((connected) => {
      if (!connected) {
        console.warn("⚠️ Database not available - using fallback adapter")
      }
    })
    return PrismaAdapter(prisma)
  } catch (error) {
    console.error("❌ PrismaAdapter failed, using fallback:", error)
    return {
      async getUser(id) {
        console.warn("🔄 Fallback getUser called - database unavailable")
        return null
      },
      async getUserByEmail(email) {
        console.warn("🔄 Fallback getUserByEmail called - database unavailable")
        return null
      },
      async getUserByAccount({ providerAccountId, provider }) {
        console.warn("🔄 Fallback getUserByAccount called - database unavailable")
        return null
      },
      async updateUser(user) {
        console.warn("🔄 Fallback updateUser called - database unavailable")
        return user
      },
      async deleteUser(userId) {
        console.warn("🔄 Fallback deleteUser called - database unavailable")
        return
      },
      async linkAccount(account) {
        console.warn("🔄 Fallback linkAccount called - database unavailable")
        return account
      },
      async unlinkAccount({ providerAccountId, provider }) {
        console.warn("🔄 Fallback unlinkAccount called - database unavailable")
        return
      },
      async createUser(user) {
        console.warn("🔄 Fallback createUser called - database unavailable")
        return { ...user, id: "fallback-" + Date.now() }
      },
      async getSessionAndUser(sessionToken) {
        console.warn("🔄 Fallback getSessionAndUser called - database unavailable")
        return null
      },
      async createSession(session) {
        console.warn("🔄 Fallback createSession called - database unavailable")
        return session
      },
      async updateSession(session) {
        console.warn("🔄 Fallback updateSession called - database unavailable")
        return session
      },
      async deleteSession(sessionToken) {
        console.warn("🔄 Fallback deleteSession called - database unavailable")
        return
      }
    }
  }
}

export const authOptions: NextAuthOptions = {
  adapter: createSafeAdapter(),
  debug: process.env.NODE_ENV === "development",
  providers: [
    // OAuth providers only
    ...(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET ? [
      DiscordProvider({
        clientId: env.DISCORD_CLIENT_ID,
        clientSecret: env.DISCORD_CLIENT_SECRET,
      })
    ] : []),
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
  ],
  pages: {
    signIn: "/clippers/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("🔍 OAuth signIn callback triggered:", {
        provider: account?.provider,
        email: user.email,
        name: user.name,
        accountId: account?.providerAccountId
      })

      // Allow Discord and Google OAuth sign in
      if (account?.provider === "discord" || account?.provider === "google") {
        console.log("✅ OAuth provider accepted:", account.provider)

        // Log the sign-in attempt for debugging
        console.log("🔐 User signed in via OAuth:", {
          email: user.email,
          provider: account.provider,
          providerAccountId: account.providerAccountId
        })

        return true
      }

      console.log("⚠️ Unknown provider:", account?.provider)
      return false
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = token.role || "CLIPPER" // Default role since DB is unavailable

        console.log("🔑 JWT token created for user:", user.email)
      }

      if (account) {
        token.accessToken = account.access_token
        token.provider = account.provider
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.accessToken = token.accessToken as string

        // Since DB is unavailable, use token name or fallback
        if (token.name) {
          session.user.name = token.name
        }

        console.log("🔐 Session created for user:", token.email)
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      console.log("🔄 Redirect callback triggered:", { url, baseUrl })
      
      // If it's a sign-in page and user is authenticated, redirect to dashboard
      if (url.includes('/clippers/login') || url.includes('/api/auth/signin')) {
        const dashboardUrl = `${baseUrl}/clippers/dashboard`
        console.log("📍 Redirecting from login to dashboard:", dashboardUrl)
        return dashboardUrl
      }
      
      // Handle relative URLs
      if (url.startsWith("/")) {
        const fullUrl = `${baseUrl}${url}`
        console.log("📍 Relative URL redirect:", fullUrl)
        return fullUrl
      }
      
      // Handle same origin URLs (including OAuth callbacks)
      if (url.startsWith(baseUrl)) {
        console.log("📍 Same origin redirect:", url)
        return url
      }
      
      // For external URLs or invalid redirects, go to dashboard
      const dashboardUrl = `${baseUrl}/clippers/dashboard`
      console.log("📍 Default redirect to dashboard:", dashboardUrl)
      return dashboardUrl
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: env.NEXTAUTH_SECRET,
}
