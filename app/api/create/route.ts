import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { lisk } from '@/lib/chains'

export const runtime = 'nodejs'

const CONTRACT_ADDRESS = '0x055cA743f0fFB9258ea7f8484794C293f32f2d4C'

// Best-effort replay protection: tracks tokens that have already been
// consumed for a generation. This is in-memory and will reset on cold
// starts — the primary verification is the on-chain isTokenUsed check.
// For production, replace with Vercel KV or a database.
declare global {
  var consumedTokens: Set<string>
}

if (!global.consumedTokens) {
  global.consumedTokens = new Set()
}

// Lazily create the viem public client (reused across invocations)
let client: ReturnType<typeof createPublicClient> | null = null

function getClient() {
  if (!client) {
    client = createPublicClient({
      chain: lisk,
      transport: http(),
    })
  }
  return client
}

// Verify on-chain that the token was used in a real payment transaction
async function verifyPaymentOnChain(tokenId: string): Promise<boolean> {
  try {
    const isUsed = await getClient().readContract({
      address: CONTRACT_ADDRESS,
      abi: [parseAbiItem('function isTokenUsed(bytes32 tokenId) view returns (bool)')],
      functionName: 'isTokenUsed',
      args: [tokenId as `0x${string}`],
    })
    return isUsed === true
  } catch (e) {
    console.error('On-chain verification failed:', e)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { image, hairstyle, shade, color, paymentToken } = await request.json()

    // Verify payment before processing
    if (!paymentToken) {
      return NextResponse.json({ error: 'Payment required' }, { status: 402 })
    }

    // Check replay protection (best-effort, in-memory)
    if (global.consumedTokens.has(paymentToken)) {
      return NextResponse.json({ error: 'Payment token already used' }, { status: 409 })
    }

    // Primary verification: check on-chain that the token was paid
    const isPaymentValid = await verifyPaymentOnChain(paymentToken)
    if (!isPaymentValid) {
      return NextResponse.json({ error: 'Payment not found on-chain' }, { status: 402 })
    }

    // Mark token as consumed for replay protection
    global.consumedTokens.add(paymentToken)

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
