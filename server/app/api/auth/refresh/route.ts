import {
  JWT_EXP_TIME,
  JWT_SECRET,
  REFRESH_TOKEN_EXP_TIME,
} from '@heat-check/shared'
import { db } from '@/db'
import * as jose from 'jose'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  let refreshToken: string | null = null

  try {
    const body = await request.json()
    refreshToken = body.refreshToken as string

    if (!refreshToken) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const accessToken = authHeader.split(' ')[1]

        // verify access token
        try {
          const decoded = await jose.jwtVerify(
            accessToken,
            new TextEncoder().encode(JWT_SECRET),
          )

          const userInfo = decoded.payload
          const issuedAt = Math.floor(Date.now() / 1000)

          const newAccessToken = await new jose.SignJWT({ ...userInfo })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime(JWT_EXP_TIME)
            .setSubject(userInfo.sub as string)
            .setIssuedAt(issuedAt)
            .sign(new TextEncoder().encode(JWT_SECRET))

          return NextResponse.json({
            accessToken: newAccessToken,
          })
        } catch (error) {
          return NextResponse.json(
            { error: 'No valid refresh token' },
            { status: 401 },
          )
        }
      }
    }

    let decoded

    try {
      decoded = await jose.jwtVerify(
        refreshToken,
        new TextEncoder().encode(JWT_SECRET),
      )
    } catch (error) {
      if (error instanceof jose.errors.JWTExpired) {
        return NextResponse.json(
          { error: 'Refresh token expired, please sign in again' },
          { status: 401 },
        )
      } else {
        return NextResponse.json(
          { error: 'Invalid refresh token, please sign in again' },
          { status: 401 },
        )
      }
    }

    const payload = decoded.payload
    if (payload.type !== 'refresh') {
      return NextResponse.json(
        { error: 'Invalid token type, sign in again' },
        { status: 400 },
      )
    }

    const sub = payload.sub
    if (!sub) {
      return NextResponse.json(
        { error: 'Invalid token, missing subject' },
        { status: 401 },
      )
    }

    const issuedAt = Math.floor(Date.now() / 1000)
    const jti = crypto.randomUUID()
    const userInfo = decoded.payload

    const hasRequiredInfo =
      userInfo.username &&
      userInfo.email &&
      userInfo.providerId &&
      userInfo.provider

    let completeUserInfo = { ...userInfo }

    if (!hasRequiredInfo) {
      const link = await db.query.userProviders.findFirst({
        where: (up, { eq }) => eq(up.providerId, sub),
        with: { user: true },
      })

      const user = link?.user

      if (!user || !link) {
        return NextResponse.json(
          { error: 'User not found by provider ID' },
          { status: 401 },
        )
      }

      completeUserInfo = {
        ...userInfo,
        email: user?.email,
        username: user?.username,
        providerId: link.providerId,
        provider: link.provider,
      }
    }

    const newAccessToken = await new jose.SignJWT(completeUserInfo)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(JWT_EXP_TIME)
      .setSubject(sub)
      .setIssuedAt(issuedAt)
      .sign(new TextEncoder().encode(JWT_SECRET))

    const newRefreshToken = await new jose.SignJWT({
      ...completeUserInfo,
      type: 'refresh',
      jti,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(REFRESH_TOKEN_EXP_TIME)
      .setIssuedAt(issuedAt)
      .sign(new TextEncoder().encode(JWT_SECRET))

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    })
  } catch (error) {
    console.error('Refresh token error: ', error)
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 },
    )
  }
}
