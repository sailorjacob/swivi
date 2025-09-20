import { NextAuthOptions } from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { env } from "@/lib/env"

export const authOptions: NextAuthOptions = {
  // Temporarily disable PrismaAdapter to test OAuth flow
  // adapter: PrismaAdapter(prisma),
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
        userId: user.id
      })
      
      if (account?.provider === "discord" || account?.provider === "google") {
        try {
          console.log("✅ OAuth provider recognized, allowing sign in")
          
          // For now, just allow the sign in without database operations
          // We'll handle user creation manually in the JWT callback
          return true
          
        } catch (error) {
          console.error("❌ Error during OAuth sign in:", error)
          return false
        }
      }
      
      console.log("✅ Non-OAuth sign in, allowing")
      return true
    },
    async jwt({ token, user, account }) {
      console.log("🔍 JWT callback triggered:", {
        hasUser: !!user,
        hasAccount: !!account,
        tokenId: token.id,
        userEmail: user?.email
      })
      
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = "CLIPPER" // Default role for now
        
        console.log("✅ JWT token updated with user info")
      }
      
      if (account) {
        token.accessToken = account.access_token
        token.provider = account.provider
        
        console.log("✅ JWT token updated with account info")
      }
      
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.accessToken = token.accessToken as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Handle post-authentication redirects
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      
      // Always go to dashboard - let the dashboard handle onboarding logic
      return `${baseUrl}/clippers/dashboard`
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: env.NEXTAUTH_SECRET,
}
