import { NextAuthOptions } from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { env } from "@/lib/env"
import { conditionalConnect } from "@/lib/db-retry"
import type { Adapter } from "next-auth/adapters"

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
      async getUser(id: string) {
        console.warn("🔄 Fallback getUser called - database unavailable")
        return null
      },
      async getUserByEmail(email: string) {
        console.warn("🔄 Fallback getUserByEmail called - database unavailable")
        return null
      },
      async getUserByAccount({ providerAccountId, provider }: { providerAccountId: string; provider: string }) {
        console.warn("🔄 Fallback getUserByAccount called - database unavailable")
        return null
      },
      async updateUser(user: any) {
        console.warn("🔄 Fallback updateUser called - database unavailable")
        return user
      },
      async deleteUser(userId: string) {
        console.warn("🔄 Fallback deleteUser called - database unavailable")
        return
      },
      async linkAccount(account: any) {
        console.warn("🔄 Fallback linkAccount called - database unavailable")
        return account
      },
      async unlinkAccount({ providerAccountId, provider }: { providerAccountId: string; provider: string }) {
        console.warn("🔄 Fallback unlinkAccount called - database unavailable")
        return
      },
      async createUser(user: any) {
        console.warn("🔄 Fallback createUser called - database unavailable")
        return { ...user, id: "fallback-" + Date.now() }
      },
      async getSessionAndUser(sessionToken: string) {
        console.warn("🔄 Fallback getSessionAndUser called - database unavailable")
        return null
      },
      async createSession(session: any) {
        console.warn("🔄 Fallback createSession called - database unavailable")
        return session
      },
      async updateSession(session: any) {
        console.warn("🔄 Fallback updateSession called - database unavailable")
        return session
      },
      async deleteSession(sessionToken: string) {
        console.warn("🔄 Fallback deleteSession called - database unavailable")
        return
      }
    } as Adapter
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
        try {
          console.log("✅ OAuth provider accepted:", account.provider)

          // Check if user exists by email
          let existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { accounts: true }
          }) as any // Type assertion to handle the include

          if (!existingUser) {
            console.log("👤 Creating new user account for:", user.email)

            // Create new user account
            existingUser = await prisma.user.create({
              data: {
                name: user.name,
                email: user.email,
                image: user.image,
                emailVerified: new Date(), // Mark as verified since OAuth provides verified email
              }
            })

            console.log("✅ New user created:", existingUser.id)
          } else {
            console.log("👤 Found existing user:", existingUser.id)

            // Update user info if needed
            if (existingUser.name !== user.name || existingUser.image !== user.image) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  name: user.name,
                  image: user.image,
                }
              })
              console.log("✅ Updated user info")
            }
          }

          // Check if OAuth account is already linked
          const existingAccount = existingUser!.accounts.find(
            (acc: any) => acc.provider === account.provider && acc.providerAccountId === account.providerAccountId
          )

          if (!existingAccount) {
            console.log("🔗 Linking OAuth account to user")
            // The account linking is handled by the PrismaAdapter automatically
            // But we need to ensure it works properly
          } else {
            console.log("✅ OAuth account already linked")
          }

          console.log("🔐 User signed in via OAuth:", {
            email: user.email,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            userId: existingUser!.id
          })

          return true

        } catch (error) {
          console.error("❌ Error in signIn callback:", error)
          return false
        }
      }

      console.log("⚠️ Unknown provider:", account?.provider)
      return false
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        // Get user role from database if available
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true }
          })
          token.role = dbUser?.role || "CLIPPER"
        } catch (error) {
          token.role = "CLIPPER" // Default role if DB unavailable
        }

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

        // Get fresh user data from database
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { name: true, email: true, image: true }
          })

          if (dbUser) {
            session.user.name = dbUser.name || token.name
            session.user.email = dbUser.email || token.email
            session.user.image = dbUser.image || token.picture
          } else {
            // Fallback to token data if user not found in DB
            session.user.name = token.name
            session.user.email = token.email
          }
        } catch (error) {
          // Fallback to token data if DB unavailable
          session.user.name = token.name
          session.user.email = token.email
          console.warn("⚠️ Could not fetch fresh user data from DB")
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
