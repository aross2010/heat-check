import { withAuth } from '../middleware'
import { AuthUser } from '@heat-check/shared'
import { NextResponse } from 'next/server'
import db from '@/db'
import { sessions } from '@/db/schema'

export const POST = withAuth(async (req: Request, user: AuthUser) => {
  try {
    const body = await req.json().catch(() => ({}))
    const name =
      typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : null
    const description =
      typeof body?.description === 'string' && body.description.trim()
        ? body.description.trim()
        : null
    const location =
      typeof body?.location === 'string' && body.location.trim()
        ? body.location.trim()
        : null

    const [session] = await db
      .insert(sessions)
      .values({
        userId: user.id,
        name,
        description,
        location,
      })
      .returning()

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('POST /api/sessions error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 },
    )
  }
})
