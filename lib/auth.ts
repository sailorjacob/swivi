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
        // Allow OAuth sign in (PrismaAdapter will handle user creation)
        if (account?.provider === "discord" || account?.provider === "google") {
          console.log("✅ OAuth provider accepted:", account.provider)
          return true
        }
        
        console.log("⚠️ Unknown provider:", account?.provider)
        return true
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
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      console.log("🔄 Redirect callback triggered:", { url, baseUrl })
      
      // Handle relative URLs
      if (url.startsWith("/")) {
        console.log("📍 Relative URL redirect:", `${baseUrl}${url}`)
        return `${baseUrl}${url}`
      }
      
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) {
        console.log("📍 Same origin redirect:", url)
        return url
      }
      
      // Always go to dashboard - let the dashboard handle onboarding logic
      console.log("📍 Default redirect to dashboard")
      return `${baseUrl}/clippers/dashboard`
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: env.NEXTAUTH_SECRET,
}
