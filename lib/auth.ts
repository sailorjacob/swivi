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
        name: user.name
      })
      
      // Allow OAuth sign in (PrismaAdapter will handle user creation)
      if (account?.provider === "discord" || account?.provider === "google") {
        return true
      }
      
      return true
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
