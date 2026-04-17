import { withAuth } from '../../../middleware'
import { AuthUser } from '@heat-check/shared'
import { NextResponse } from 'next/server'
import db from '@/db'
import { sessions, shots } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const POST = withAuth(async (req: Request, user: AuthUser) => {
  const parts = new URL(req.url).pathname.split('/')
  const sessionId = parts[parts.length - 2]

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session id' }, { status: 400 })
  }

  try {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const shotData = body.shots as {
      made: boolean
      shotLocation: 'left' | 'center' | 'right'
      takenAt: string
    }[]

    if (!Array.isArray(shotData) || shotData.length === 0) {
      return NextResponse.json({ ok: true })
    }

    await db.insert(shots).values(
      shotData.map((s) => ({
        sessionId,
        made: s.made,
        shotLocation: s.shotLocation,
        takenAt: s.takenAt ? new Date(s.takenAt) : new Date(),
      })),
    )

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to save shots' },
      { status: 500 },
    )
  }
})
