import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createClipSchema = z.object({
  url: z.string().url(),
  platform: z.enum(["TIKTOK", "YOUTUBE", "INSTAGRAM", "TWITTER", "FACEBOOK"]),
  title: z.string().optional(),
  description: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the internal user ID from the database using supabaseAuthId
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const clips = await prisma.clip.findMany({
      where: {
        userId: dbUser.id
      },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        clipSubmissions: {
          include: {
            campaign: true
          }
        }
      }
    })

    return NextResponse.json(clips)
  } catch (error) {
    console.error("Error fetching clips:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole(request)

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the internal user ID from the database using supabaseAuthId
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = createClipSchema.parse(body)

    const clip = await prisma.clip.create({
      data: {
        userId: dbUser.id,
        url: validatedData.url,
        platform: validatedData.platform,
        title: validatedData.title,
        description: validatedData.description,
        status: "ACTIVE"
      }
    })

    return NextResponse.json(clip, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }
    
    console.error("Error creating clip:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
