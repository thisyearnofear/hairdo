import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { Redis } from '@upstash/redis'
import { lisk } from '@/lib/chains'

export const runtime = 'nodejs'

const CONTRACT_ADDRESS = '0x055cA743f0fFB9258ea7f8484794C293f32f2d4C'

// Upstash Redis client for persistent replay protection.
// Falls back to in-memory if env vars are not set (e.g. local dev).
let redis: Redis | null = null
function getRedis() {
  if (!redis && process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  }
  return redis
}

// In-memory fallback for local development
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
  // tokenId must be a 0x-prefixed 32-byte hex string (66 chars total)
  if (!tokenId || !tokenId.startsWith('0x') || tokenId.length !== 66) {
    return false
  }

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

// Check if a token has already been consumed (replay protection)
async function isTokenConsumed(tokenId: string): Promise<boolean> {
  const r = getRedis()
  if (r) {
    const result = await r.get(`consumed:${tokenId}`)
    return result !== null
  }
  return global.consumedTokens.has(tokenId)
}

// Mark a token as consumed (replay protection)
async function markTokenConsumed(tokenId: string): Promise<void> {
  const r = getRedis()
  if (r) {
    // TTL of 30 days — tokens are one-time use, no need to keep forever
    await r.set(`consumed:${tokenId}`, '1', { ex: 30 * 24 * 60 * 60 })
  } else {
    global.consumedTokens.add(tokenId)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { image, hairstyle, shade, color, paymentToken } = await request.json()

    // Verify payment before processing
    if (!paymentToken) {
      return NextResponse.json({ error: 'Payment required' }, { status: 402 })
    }

    // Check replay protection
    if (await isTokenConsumed(paymentToken)) {
      return NextResponse.json({ error: 'Payment token already used' }, { status: 409 })
    }

    // Primary verification: check on-chain that the token was paid
    const isPaymentValid = await verifyPaymentOnChain(paymentToken)
    if (!isPaymentValid) {
      return NextResponse.json({ error: 'Payment not found on-chain' }, { status: 402 })
    }

    // Mark token as consumed for replay protection
    await markTokenConsumed(paymentToken)

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
