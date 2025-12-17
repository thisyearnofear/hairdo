import { NextRequest, NextResponse } from 'next/server'

// In a production environment, you would interact with your smart contract here
// For now, we'll use a simple in-memory store to simulate payment verification
const paymentRecords: Record<string, boolean> = {}

export const runtime = 'edge'

// Helper function to verify payment (in production, this would interact with the blockchain)
async function verifyPayment(tokenId: string): Promise<boolean> {
  // In a real implementation, you would:
  // 1. Connect to the Lisk network
  // 2. Call your smart contract to check if the tokenId has been used for payment
  // 3. Return true if valid, false otherwise
  
  // For demo purposes, we'll just check our in-memory store
  const isValid = paymentRecords[tokenId] === true;
  
  // Remove the token after use to prevent reuse (optional, depending on your use case)
  if (isValid) {
    delete paymentRecords[tokenId];
  }
  
  return isValid;
}

export async function POST(request: NextRequest) {
  try {
    const { image, hairstyle, shade, color, paymentToken } = await request.json()
    
    // Verify payment before processing
    if (!paymentToken) {
      return NextResponse.json({ error: 'Payment required' }, { status: 402 })
    }
    
    const isPaymentValid = await verifyPayment(paymentToken);
    if (!isPaymentValid) {
      return NextResponse.json({ error: 'Invalid or expired payment' }, { status: 402 })
    }
    
    // Using public model
    const endpoint = 'https://api.replicate.com/v1/predictions'
    
    // Create prediction
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Token ' + process.env.REPLICATE_API_TOKEN
      },
      body: JSON.stringify({
        version:
          'b95cb2a16763bea87ed7ed851d5a3ab2f4655e94bcfb871edba029d4814fa587',
        input: {
          image,
          editing_type: 'both',
          hairstyle_description: hairstyle,
          color_description: `${shade} ${color}`
        }
      })
    })
    
    const json = await response.json()
    
    // Parse prediction
    const id = json.id
    const status = json.status
    const output = json.output
    
    return NextResponse.json({ id, status, output })
  } catch (e) {
    console.error('ERROR', e)
    return NextResponse.json({ error: 'Failed to create prediction' }, { status: 500 })
  }
}