import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { RECEIPT_PARSING_PROMPT } from '@/lib/prompts'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  try {
    const { image, mediaType = 'image/jpeg' } = await request.json()

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: image,
            },
          },
          {
            type: 'text',
            text: RECEIPT_PARSING_PROMPT,
          },
        ],
      }],
    })

    const textBlock = response.content[0]
    if (textBlock.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response format' }, { status: 500 })
    }

    const cleaned = textBlock.text
      .replace(/```json\n?/g, '')
      .replace(/```/g, '')
      .trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse Claude response:', cleaned)
      return NextResponse.json(
        { error: 'Claude returned invalid JSON', raw: cleaned },
        { status: 500 }
      )
    }

    console.log(`Parse receipt: ${response.usage.input_tokens} in, ${response.usage.output_tokens} out`)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Parse receipt error:', error)
    return NextResponse.json(
      { error: 'Failed to parse receipt', details: error instanceof Error ? error.message : 'unknown' },
      { status: 500 }
    )
  }
}