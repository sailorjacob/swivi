import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole()

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ role: userData.role })
  } catch (error) {
    console.error("Error fetching user role:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
