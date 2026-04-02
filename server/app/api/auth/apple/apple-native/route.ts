import { NextResponse } from 'next/server'
import { verifyAndCreateTokens } from '@/functions/apple-auth'
export async function POST(req: Request) {
  const { identityToken, rawNonce, providerId } = await req.json()

  try {
    const { accessToken, refreshToken } = await verifyAndCreateTokens({
      identityToken,
      rawNonce,
      providerId,
    })

    return NextResponse.json({ accessToken, refreshToken }, { status: 200 })
  } catch (error) {
    if ((error as Error).message.includes('Apple user not found')) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to verify Apple token' },
      { status: 500 },
    )
  }
}
