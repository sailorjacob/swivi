import { NextAuthOptions } from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { env } from "@/lib/env"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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

        // Ensure user exists in database before allowing sign in
        try {
          if (user.email) {
            let dbUser = await prisma.user.findUnique({
              where: { email: user.email }
            })

            if (!dbUser && account?.providerAccountId) {
              console.log("🔄 Creating new user for OAuth:", user.email)

              // Create user if they don't exist
              dbUser = await prisma.user.create({
                data: {
                  email: user.email,
                  name: user.name,
                  role: "CLIPPER",
                  verified: false,
                }
              })

              console.log("✅ User created successfully:", dbUser.id)

              // Create account record
              if (account && dbUser.id) {
                await prisma.account.create({
                  data: {
                    userId: dbUser.id,
                    type: account.type,
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                    access_token: account.access_token,
                    refresh_token: account.refresh_token,
                    expires_at: account.expires_at,
                    token_type: account.token_type,
                    scope: account.scope,
                    id_token: account.id_token,
                    session_state: account.session_state,
                  }
                })
                console.log("✅ Account record created successfully")
              }
            }
          }
        } catch (error) {
          console.error("❌ Error in signIn callback:", error)
          // Still allow sign in even if database operations fail
          // This prevents blocking users when database is temporarily unavailable
        }

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

        // Fetch current role from database and set it in token
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true, email: true }
          })

          if (dbUser) {
            token.role = dbUser.role
            console.log("✅ Found user in database:", dbUser.email)
          } else {
            console.warn("⚠️ User not found in database during JWT creation:", user.id)
            // Try to find user by email if ID lookup fails
            if (user.email) {
              const userByEmail = await prisma.user.findUnique({
                where: { email: user.email },
                select: { id: true, role: true }
              })

              if (userByEmail) {
                token.id = userByEmail.id // Update token ID to match database
                token.role = userByEmail.role
                console.log("✅ Found user by email:", user.email)
              } else {
                console.warn("⚠️ User not found by email either:", user.email)
                token.role = "CLIPPER" // Default role
              }
            }
          }
        } catch (error) {
          console.error("❌ Failed to fetch role for JWT token:", error)
          // Keep existing role or set default
          token.role = token.role || "CLIPPER"
        }
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

        // Update session name from database if available and valid
        try {
          const user = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { name: true, email: true }
          })

          if (user) {
            console.log("✅ Found user for session:", user.email)
            if (user.name && user.name !== ";Updated name;" && user.name.trim() !== "") {
              session.user.name = user.name
            }
          } else {
            console.warn("⚠️ User not found for session update:", token.id)
            // Try to find user by email
            if (token.email) {
              const userByEmail = await prisma.user.findUnique({
                where: { email: token.email as string },
                select: { id: true, name: true }
              })

              if (userByEmail) {
                console.log("✅ Found user by email for session:", token.email)
                if (userByEmail.name && userByEmail.name !== ";Updated name;" && userByEmail.name.trim() !== "") {
                  session.user.name = userByEmail.name
                }
                // Update session user ID to match database
                session.user.id = userByEmail.id
              } else {
                console.warn("⚠️ User not found by email for session:", token.email)
              }
            }
          }
        } catch (error) {
          console.error("❌ Failed to update session name from database:", error)
        }
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
