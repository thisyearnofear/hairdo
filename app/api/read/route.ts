import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()

    // Read prediction
    const response = await fetch(
      `https://api.replicate.com/v1/predictions/${id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Token ' + process.env.REPLICATE_API_TOKEN
        }
      }
    )

    const json = await response.json()

    // Parse prediction
    const status = json.status
    const output = json.output

    return NextResponse.json({ id, status, output })
  } catch (e) {
    console.error('ERROR', e)
    return NextResponse.json({ error: 'Failed to read prediction' }, { status: 500 })
  }
}
