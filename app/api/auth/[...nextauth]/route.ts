// Test if this API route loads - logging for debugging
console.log("🚨 NEXTAUTH API ROUTE IS LOADING - DEBUG TEST")

import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// Test if authOptions is imported successfully - logging for debugging
console.log("🚨 AUTH OPTIONS IMPORTED - DEBUG TEST:", typeof authOptions)

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
