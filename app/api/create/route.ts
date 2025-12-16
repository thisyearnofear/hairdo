import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const { image, hairstyle, shade, color } = await request.json()

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
