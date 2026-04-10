import { withAuth } from '../../middleware'
import { AuthUser, HomeData } from '@heat-check/shared'
import { NextResponse } from 'next/server'
import db from '@/db'
import { sessions, shots } from '@/db/schema'
import { eq, count, sql, desc } from 'drizzle-orm'
import { getPlayerComp } from '@/functions/player-comp'

export const GET = withAuth(async (req: Request, user: AuthUser) => {
  const userId = new URL(req.url).pathname.split('/').pop()

  if (userId !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [statsRows, sessionRows, lastSession] = await Promise.all([
      db
        .select({
          totalShots: count(),
          totalMakes: sql<number>`count(*) filter (where ${shots.made} = true)`,
        })
        .from(shots)
        .innerJoin(sessions, eq(shots.sessionId, sessions.id))
        .where(eq(sessions.userId, userId!)),
      db
        .select({
          id: sessions.id,
          userId: sessions.userId,
          startTime: sessions.startTime,
          endTime: sessions.endTime,
          date: sessions.date,
          location: sessions.location,
          name: sessions.name,
          description: sessions.description,
          totalShots: count(shots.id),
          totalMakes: sql<number>`count(*) filter (where ${shots.made} = true)`,
        })
        .from(sessions)
        .leftJoin(shots, eq(shots.sessionId, sessions.id))
        .where(eq(sessions.userId, userId!))
        .groupBy(sessions.id)
        .orderBy(desc(sessions.startTime))
        .limit(10),
      db.query.sessions.findFirst({
        where: eq(sessions.userId, userId!),
        with: { shots: true },
        orderBy: [desc(sessions.startTime)],
      }),
    ])

    const { totalShots, totalMakes } = statsRows[0]
    const totalMisses = totalShots - totalMakes
    const shootingPercentage =
      totalShots > 0 ? (totalMakes / totalShots) * 100 : 0

    const data: HomeData = {
      stats: { totalShots, totalMakes, totalMisses, shootingPercentage },
      playerComp: getPlayerComp(shootingPercentage),
      lastSession: lastSession
        ? {
            id: lastSession.id,
            userId: lastSession.userId,
            date: lastSession.date,
            startedAt: lastSession.startTime?.toISOString() ?? '',
            endedAt: lastSession.endTime?.toISOString() ?? '',
            location: lastSession.location ?? undefined,
            name: lastSession.name ?? undefined,
            description: lastSession.description ?? undefined,
            shots: lastSession.shots.map((shot) => ({
              id: shot.id,
              sessionId: shot.sessionId,
              made: shot.made,
              shotLocation: shot.shotLocation,
              x: shot.x,
              y: shot.y,
              takenAt: shot.takenAt?.toISOString() ?? '',
            })),
          }
        : null,
      previousSessions: sessionRows.map((s) => {
        const makes = s.totalMakes
        const total = s.totalShots
        return {
          id: s.id,
          userId: s.userId,
          date: s.date,
          startedAt: s.startTime?.toISOString() ?? '',
          endedAt: s.endTime?.toISOString() ?? '',
          location: s.location ?? undefined,
          name: s.name ?? undefined,
          description: s.description ?? undefined,
          totalShots: total,
          totalMakes: makes,
          shootingPercentage: total > 0 ? (makes / total) * 100 : 0,
        }
      }),
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error fetching home data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch home data' },
      { status: 500 },
    )
  }
})
