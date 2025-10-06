import { NextRequest, NextResponse } from "next/server"
import { getServerUserWithRole } from "@/lib/supabase-auth-server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createPayoutSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(["PAYPAL", "BANK_TRANSFER", "STRIPE"]),
  paypalEmail: z.string().email().optional(),
  bankDetails: z.object({
    accountNumber: z.string(),
    routingNumber: z.string(),
    accountHolderName: z.string(),
  }).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole()

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payouts = await prisma.payout.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(payouts)
  } catch (error) {
    console.error("Error fetching payouts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getServerUserWithRole()

    if (!user?.id || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createPayoutSchema.parse(body)

    // Get user's current earnings
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { totalEarnings: true }
    })

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const availableBalance = Number(userData.totalEarnings)
    
    if (validatedData.amount > availableBalance) {
      return NextResponse.json({ 
        error: "Insufficient balance", 
        available: availableBalance,
        requested: validatedData.amount 
      }, { status: 400 })
    }

    // Calculate fees (2.5% for PayPal, 1% for bank transfer)
    const feeRate = validatedData.method === "PAYPAL" ? 0.025 : 0.01
    const fee = validatedData.amount * feeRate
    const netAmount = validatedData.amount - fee

    const payout = await prisma.payout.create({
      data: {
        userId: user.id,
        amount: validatedData.amount,
        method: validatedData.method,
        paypalEmail: validatedData.paypalEmail,
        bankDetails: validatedData.bankDetails,
        fee: fee,
        netAmount: netAmount,
        status: "PENDING"
      }
    })

    // Update user's total earnings
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalEarnings: {
          decrement: validatedData.amount
        }
      }
    })

    return NextResponse.json(payout, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }
    
    console.error("Error creating payout:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
