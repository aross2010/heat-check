import * as jose from 'jose'
import { AuthUser, JWT_SECRET, User } from '@heat-check/shared'
import { NextResponse } from 'next/server'

export function withAuth<T extends Response>(
  handler: (req: Request, user: AuthUser) => Promise<T>,
) {
  return async (req: Request): Promise<T | Response> => {
    try {
      let token: string | null = null

      const authHeader = req.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1]
      }

      if (!token) {
        return NextResponse.json(
          {
            error: 'Unauthorized',
          },
          {
            status: 401,
          },
        )
      }

      const jwtSecret = JWT_SECRET

      if (!jwtSecret) {
        return NextResponse.json(
          {
            error: 'Internal server error',
          },
          {
            status: 500,
          },
        )
      }

      const decoded = await jose.jwtVerify(
        token,
        new TextEncoder().encode(jwtSecret),
      )

      // call the desired route w/ user info
      return await handler(req, decoded.payload as AuthUser)
    } catch (error) {
      if (error instanceof jose.errors.JWTExpired) {
        return NextResponse.json(
          {
            error: 'Token expired',
          },
          {
            status: 401,
          },
        )
      } else if (error instanceof jose.errors.JWTInvalid) {
        return NextResponse.json(
          {
            error: 'Token invalid',
          },
          {
            status: 401,
          },
        )
      }
      return NextResponse.json(
        {
          error: 'Something went wrong',
        },
        {
          status: 500,
        },
      )
    }
  }
}
