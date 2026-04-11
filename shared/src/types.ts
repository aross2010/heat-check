export type ProviderName = 'apple' | 'google'
export type ShotLocation = 'left' | 'center' | 'right' // shot relative to basket

export type Provider = {
  id: string
  name: ProviderName
  email: string
}

export type User = {
  id: string | null
  username: string
  email: string
}

export type AuthUser = {
  id: string
  exp: number
  iat: number
  jti: string
  type: 'refresh' | 'access'
}

export type Shot = {
  id: string
  sessionId: string
  made: boolean
  shotLocation: ShotLocation
  takenAt: string
}

export type Session = {
  id: string
  userId: string
  date: string
  startedAt: string
  endedAt: string
  location?: string
  name?: string
  description?: string
  shots: Shot[]
}

export type SessionSummary = Omit<Session, 'shots'> & {
  totalShots: number
  totalMakes: number
  shootingPercentage: number
}

export type HomeData = {
  stats: {
    totalShots: number
    totalMakes: number
    totalMisses: number
    shootingPercentage: number
  }
  previousSessions: SessionSummary[]
}

export type ShotChartData = {
  left: { made: number; total: number }
  center: { made: number; total: number }
  right: { made: number; total: number }
}

export type CreatedSession = {
  id: string
  userId: string
  date: string
  location?: string
  name?: string
  description?: string
}
