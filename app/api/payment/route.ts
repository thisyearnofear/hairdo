import { NextRequest, NextResponse } from 'next/server'
import { paymentRecords } from './create/route'

export const runtime = 'edge'

// This endpoint simulates recording a payment (in production, this would be handled by the smart contract)
export async function POST(request: NextRequest) {
  try {
    const { tokenId } = await request.json()
    
    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID required' }, { status: 400 })
    }
    
    // Record the payment in our in-memory store (simulating blockchain storage)
    paymentRecords[tokenId] = true
    
    return NextResponse.json({ success: true, message: 'Payment recorded' })
  } catch (e) {
    console.error('ERROR', e)
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 })
  }
}