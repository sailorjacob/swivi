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
    // Temporarily disabled until Google app verification is complete
    // ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? [
    //   GoogleProvider({
    //     clientId: env.GOOGLE_CLIENT_ID,
    //     clientSecret: env.GOOGLE_CLIENT_SECRET,
    //   })
    // ] : []),
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
      
      try {
        // Validate required fields
        if (!user.email) {
          console.error("❌ No email provided by OAuth provider")
          return false
        }
        
        // Allow OAuth sign in (PrismaAdapter will handle user creation)
        if (account?.provider === "discord" || account?.provider === "google") {
          console.log("✅ OAuth provider accepted:", account.provider)
          return true
        }
        
        console.log("⚠️ Unknown provider:", account?.provider)
        return false
      } catch (error) {
        console.error("❌ SignIn callback error:", error)
        return false
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        
        // Set default role for new users
        token.role = "CLIPPER"
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
            select: { name: true }
          })

          if (user?.name && user.name !== ";Updated name;" && user.name.trim() !== "") {
            session.user.name = user.name
          }
        } catch (error) {
          console.error("Failed to update session name from database:", error)
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
