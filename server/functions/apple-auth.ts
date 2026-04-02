import * as jose from 'jose'
import crypto from 'crypto'
import {
  JWT_EXP_TIME,
  REFRESH_TOKEN_EXP_TIME,
  JWT_SECRET,
} from '@heat-check/shared'
import { db } from '@/db'

interface AppleAuthResult {
  accessToken: string
  refreshToken: string
}

interface AppleUserInfo {
  identityToken: string
  rawNonce: string
  providerId: string
}

export async function verifyAndCreateTokens({
  identityToken,
  rawNonce,
  providerId,
}: AppleUserInfo): Promise<AppleAuthResult> {
  // Apple's public keys from their JWKS endpoint
  const JWKS = jose.createRemoteJWKSet(
    new URL('https://appleid.apple.com/auth/keys'),
  )

  try {
    const { payload } = await jose.jwtVerify(identityToken, JWKS, {
      issuer: 'https://appleid.apple.com',
      audience: 'app.aross.heatcheck',
    })

    const currentTimestamp = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < currentTimestamp) {
      throw new Error('Token has expired')
    }

    if (!payload.sub || !payload.iss || !payload.aud || !payload.nonce) {
      throw new Error('Missing required claims in token')
    }

    if ((payload as any).nonce_supported) {
      if (payload.nonce !== rawNonce) {
        throw new Error('Invalid nonce')
      }
    } else {
      const computedHashedNonce = crypto
        .createHash('sha256')
        .update(Buffer.from(rawNonce, 'utf8'))
        .digest('base64url')

      if (payload.nonce !== computedHashedNonce) {
        throw new Error('Invalid nonce')
      }
    }

    const link = await db.query.userProviders.findFirst({
      where: (up, { and, eq }) =>
        and(eq(up.provider, 'apple'), eq(up.providerId, providerId)),
      with: {
        user: true,
      },
    })

    let userInDbProviderId = null
    let userInDb = null

    if (link) {
      userInDb = link.user
      userInDbProviderId = link.providerId
    }

    if (!userInDb || !userInDbProviderId) {
      throw new Error(
        'Apple user not found in database, original sign up attempt failed.',
      )
    }

    const user = {
      id: userInDb.id,
      email: userInDb.email,
      username: userInDb.username,
      provider: 'apple',
      providerId: userInDbProviderId,
    }

    const issuedAt = Math.floor(Date.now() / 1000)
    const jti = crypto.randomUUID()

    const accessToken = await new jose.SignJWT(user)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(JWT_EXP_TIME)
      .setSubject(userInDbProviderId)
      .setIssuedAt(issuedAt)
      .sign(new TextEncoder().encode(JWT_SECRET))

    // Create refresh token (long-lived)
    const refreshToken = await new jose.SignJWT({
      jti,
      type: 'refresh',
      sub: user.providerId,
      ...user,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(REFRESH_TOKEN_EXP_TIME)
      .setIssuedAt(issuedAt)
      .sign(new TextEncoder().encode(JWT_SECRET))

    return {
      accessToken,
      refreshToken,
    }
  } catch (error) {
    console.error('Token verification failed:', error)
    throw error
  }
}
