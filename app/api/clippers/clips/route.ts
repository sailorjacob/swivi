import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../lib/auth"
import { prisma } from "../../../../lib/prisma"
import { z } from "zod"

const createClipSchema = z.object({
  url: z.string().url(),
  platform: z.enum(["TIKTOK", "YOUTUBE", "INSTAGRAM", "TWITTER", "FACEBOOK"]),
  title: z.string().optional(),
  description: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clips = await prisma.clip.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        submissions: {
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createClipSchema.parse(body)

    const clip = await prisma.clip.create({
      data: {
        userId: session.user.id,
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
