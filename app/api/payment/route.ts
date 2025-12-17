import { NextRequest, NextResponse } from 'next/server'

// In-memory store for payment records (in production, use a database)
const paymentRecords: Record<string, boolean> = {}

// Share the same store between both API routes in Node.js runtime
declare global {
  var sharedPaymentRecords: Record<string, boolean>;
}

// Use a global variable to persist data in development
if (!global.sharedPaymentRecords) {
  global.sharedPaymentRecords = {};
}

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
    try {
        const { tokenId } = await request.json()

        if (!tokenId) {
            return NextResponse.json({ error: 'Token ID is required' }, { status: 400 })
        }

        // Store the payment token as valid
        global.sharedPaymentRecords[tokenId] = true

        console.log('Payment recorded successfully for token:', tokenId)

        return NextResponse.json({
            success: true,
            message: 'Payment recorded successfully',
            tokenId
        })
    } catch (e) {
        console.error('Payment recording error:', e)
        return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
    }
}