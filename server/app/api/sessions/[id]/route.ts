import { withAuth } from '../../middleware'
import { AuthUser, Session } from '@heat-check/shared'
import { NextResponse } from 'next/server'
import db from '@/db'
import { sessions } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const GET = withAuth(async (req: Request, user: AuthUser) => {
  const sessionId = new URL(req.url).pathname.split('/').pop()

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session id' }, { status: 400 })
  }

  try {
    const row = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
      with: {
        shots: {
          columns: {
            id: true,
            sessionId: true,
            made: true,
            shotLocation: true,
            takenAt: true,
          },
          orderBy: (shots, { asc }) => [asc(shots.takenAt)],
        },
      },
    })

    if (!row) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (row.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data: Session = {
      id: row.id,
      userId: row.userId,
      date: row.date,
      startedAt: row.startTime?.toISOString() ?? '',
      endedAt: row.endTime?.toISOString() ?? '',
      location: row.location ?? undefined,
      name: row.name ?? undefined,
      description: row.description ?? undefined,
      shots: row.shots.map((shot) => ({
        id: shot.id,
        sessionId: shot.sessionId,
        made: shot.made,
        shotLocation: shot.shotLocation,
        takenAt: shot.takenAt?.toISOString() ?? '',
      })),
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 },
    )
  }
})
