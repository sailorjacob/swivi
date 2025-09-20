import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import DiscordProvider from "next-auth/providers/discord"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { env } from "@/lib/env"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    }),
    // Only include OAuth providers if credentials are available
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
      if (account?.provider === "discord" || account?.provider === "google") {
        try {
          console.log("OAuth sign in attempt:", { 
            provider: account?.provider, 
            email: user.email,
            name: user.name 
          })

          // Check if user exists, if not create with default clipper role
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })
          
          if (!existingUser) {
            console.log("Creating new user for:", user.email)
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                image: user.image,
                role: "CLIPPER",
                verified: false,
              }
            })
            console.log("User created successfully")
          } else {
            console.log("Existing user found:", existingUser.email)
          }
          
          return true
        } catch (error) {
          console.error("Error during OAuth sign in:", error)
          // Still allow sign in even if database fails
          return true
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        try {
          // Get user role from database
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id }
          })
          token.role = dbUser?.role || "CLIPPER"
        } catch (error) {
          console.error("Error fetching user role:", error)
          token.role = "CLIPPER" // Fallback role
        }
      }
      if (account) {
        token.accessToken = account.access_token
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
      
      // For new OAuth users, redirect to onboarding first
      // For existing users, go to dashboard
      // We'll let the onboarding page handle the logic
      return `${baseUrl}/clippers/onboarding`
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: env.NEXTAUTH_SECRET,
}
