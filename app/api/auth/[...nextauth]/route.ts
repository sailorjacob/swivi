// Test if this API route loads at all
console.log("🚨 NEXTAUTH API ROUTE IS LOADING")

import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// Test if authOptions is imported successfully
console.log("🚨 AUTH OPTIONS IMPORTED:", typeof authOptions)

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
