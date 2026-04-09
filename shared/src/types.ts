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
  x: number
  y: number
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
  playerComp: string // compared to nba player based on shooting percentage
  lastSession: Session | null
  previousSessions: SessionSummary[]
}
