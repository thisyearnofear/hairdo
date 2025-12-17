import { NextRequest, NextResponse } from 'next/server'

// Share the same store between both API routes in Node.js runtime
declare global {
  var sharedPaymentRecords: Record<string, boolean>;
}

// Initialize the shared store
if (!global.sharedPaymentRecords) {
  global.sharedPaymentRecords = {};
}

export const runtime = 'nodejs'

// In production, this would be replaced with actual blockchain verification
async function verifyPayment(tokenId: string): Promise<boolean> {
  const isValid = global.sharedPaymentRecords[tokenId] === true;

  // Remove the token after use to prevent reuse
  if (isValid) {
    delete global.sharedPaymentRecords[tokenId];
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