// Test if this file loads - logging for debugging
console.log("🚨 AUTH.TS FILE IS LOADING - DEBUG TEST")

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
  console.log("🚨 CREATING SAFE ADAPTER")
  try {
    // Test database connection first
    conditionalConnect().then((connected) => {
      if (!connected) {
        console.warn("⚠️ Database not available - using fallback adapter")
      } else {
        console.log("✅ Database connected - using PrismaAdapter")
      }
    })

    // Create a wrapped adapter with enhanced logging
    const adapter = PrismaAdapter(prisma)

    // Wrap adapter methods with logging
    const loggedAdapter = {
      ...adapter,
      async getUser(id: string) {
        console.log("🔍 Adapter getUser called for ID:", id)
        try {
          const user = await adapter.getUser!(id)
          console.log("✅ Adapter getUser success:", user?.email)
          return user
        } catch (error) {
          console.error("❌ Adapter getUser error:", error)
          return null
        }
      },
      async getUserByAccount({ providerAccountId, provider }: { providerAccountId: string; provider: string }) {
        console.log("🔍 Adapter getUserByAccount called:", { providerAccountId, provider })
        try {
          const user = await adapter.getUserByAccount!({ providerAccountId, provider })
          console.log("✅ Adapter getUserByAccount success:", user?.email)
          return user
        } catch (error) {
          console.error("❌ Adapter getUserByAccount error:", error)
          return null
        }
      },
      async getUserByEmail(email: string) {
        console.log("🔍 Adapter getUserByEmail called for:", email)
        try {
          const user = await adapter.getUserByEmail!(email)
          console.log("✅ Adapter getUserByEmail success:", user?.id)
          return user
        } catch (error) {
          console.error("❌ Adapter getUserByEmail error:", error)
          return null
        }
      },
      async createUser(user: any) {
        console.log("🔍 Adapter createUser called for:", user.email)
        try {
          const newUser = await adapter.createUser!(user)
          console.log("✅ Adapter createUser success:", newUser.id)
          return newUser
        } catch (error) {
          console.error("❌ Adapter createUser error:", error)
          return user
        }
      },
      async linkAccount(account: any) {
        console.log("🔍 Adapter linkAccount called for provider:", account.provider)
        try {
          await adapter.linkAccount!(account)
          console.log("✅ Adapter linkAccount success")
        } catch (error) {
          console.error("❌ Adapter linkAccount error:", error)
        }
      }
    }

    return loggedAdapter
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

console.log("🚨 CREATING AUTH OPTIONS")
export const authOptions: NextAuthOptions = {
  adapter: createSafeAdapter(),
  debug: process.env.NODE_ENV === "development",

  // Test if auth configuration is loading
  events: {
    async signIn(message) {
      console.log("🚨 NEXTAUTH SIGNIN EVENT TRIGGERED:", {
        user: message.user?.email,
        account: message.account?.provider,
        isNewUser: message.isNewUser
      })
    }
  },

  // Add some basic logging to verify auth config loads
  logger: {
    error(code, metadata) {
      console.error("🚨 NEXTAUTH ERROR:", code, metadata)
    },
    warn(code) {
      console.warn("🚨 NEXTAUTH WARN:", code)
    },
    debug(code, metadata) {
      console.debug("🚨 NEXTAUTH DEBUG:", code, metadata)
    }
  },
  providers: [
    // OAuth providers only
    ...(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET ? [
      DiscordProvider({
        clientId: env.DISCORD_CLIENT_ID,
        clientSecret: env.DISCORD_CLIENT_SECRET,
        authorization: {
          url: "https://discord.com/api/oauth2/authorize",
          params: {
            scope: "identify email",
          },
        },
        token: "https://discord.com/api/oauth2/token",
        userinfo: "https://discord.com/api/users/@me",
        checks: ["state"],
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
      console.log("🚨 SIGNIN CALLBACK TRIGGERED - DEVELOPMENT TEST")
      console.log("🔍 OAuth signIn callback triggered:", {
        provider: account?.provider,
        email: user?.email,
        name: user?.name,
        accountId: account?.providerAccountId
      })

      // Test if callback is called - log and continue with normal flow
      console.log("🚨 SIGNIN CALLBACK: This should appear in logs")

      // Continue with normal OAuth flow

      // Allow Discord and Google OAuth sign in
      if (account?.provider === "discord" || account?.provider === "google") {
        console.log("✅ OAuth provider accepted:", account.provider)
        console.log("🔍 Account details:", {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          accessToken: account.access_token ? "present" : "missing",
          scope: account.scope
        })

        // Debug: Check if this is the initial authorization request
        if (!account.access_token) {
          console.log("🔍 This is an authorization request - should redirect to Discord")
        } else {
          console.log("🔍 This is a token exchange - OAuth callback completed")
        }

        try {
          // Check if user exists by email
          console.log("🔍 Checking for existing user with email:", user.email)
          if (!user.email) {
            console.error("❌ No email provided by OAuth provider")
            return false
          }

          let existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { accounts: true }
          }) as any

          if (!existingUser) {
            console.log("👤 Creating new user account for:", user.email)

            // Create new user account with all required fields
            existingUser = await prisma.user.create({
              data: {
                name: user.name || "Discord User",
                email: user.email,
                image: user.image || null,
                emailVerified: new Date(),
                verified: true, // Since OAuth provides verified email
                // Add default values for other fields
                role: "CLIPPER",
                bio: null,
                website: null,
                location: null,
                walletAddress: null,
                paypalEmail: null,
                totalEarnings: 0,
                totalViews: 0,
              }
            })

            console.log("✅ New user created with ID:", existingUser.id)
          } else {
            console.log("👤 Found existing user with ID:", existingUser.id)

            // Update user info if needed
            if (existingUser.name !== user.name || existingUser.image !== user.image) {
              console.log("🔄 Updating user info...")
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  name: user.name || existingUser.name,
                  image: user.image || existingUser.image,
                  emailVerified: new Date(), // Refresh verification
                }
              })
              console.log("✅ Updated user info")
            }
          }

          // Check if OAuth account is already linked
          const existingAccount = existingUser!.accounts?.find(
            (acc: any) => acc.provider === account.provider && acc.providerAccountId === account.providerAccountId
          )

          if (!existingAccount) {
            console.log("🔗 OAuth account not linked, but will be linked by PrismaAdapter")
          } else {
            console.log("✅ OAuth account already linked")
          }

          console.log("🔐 OAuth sign in successful for user:", {
            email: user.email,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            userId: existingUser!.id
          })

          return true

        } catch (error) {
          console.error("❌ Error in signIn callback:", error)
          console.error("❌ Error details:", {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            user: user.email,
            provider: account?.provider
          })
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
