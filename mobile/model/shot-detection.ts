// logic for detecting shots, shot locations, and shot outcomes

export interface BallPos {
  cx: number
  cy: number
  frame: number
  w: number
  h: number
  conf: number
}

export interface HoopPos {
  cx: number
  cy: number
  frame: number
  w: number
  h: number
  conf: number
}

export interface PlayerPos {
  cx: number
  cy: number
  frame: number
  w: number
  h: number
  conf: number
}

export interface Shot {
  frame: number
  timestamp: string
  result: 'MAKE' | 'MISS'
  zone: string
}

export function frameToTimestamp(frameNum: number, fps: number): string {
  const totalSeconds = frameNum / fps
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toFixed(2).padStart(5, '0')}`
}

export function getZone(
  ballAtRelease: BallPos | null,
  playerAtRelease: PlayerPos | null,
  hoopAtShot: HoopPos | null,
): string {
  if (!hoopAtShot) return 'Unknown'

  const hoopCx = hoopAtShot.cx
  const hoopW = hoopAtShot.w

  let refCx: number
  if (playerAtRelease) {
    refCx = playerAtRelease.cx
  } else if (ballAtRelease) {
    refCx = ballAtRelease.cx
  } else {
    return 'Unknown'
  }

  const hRatio = (refCx - hoopCx) / hoopW

  if (hRatio < -1.5) return 'Left'
  if (hRatio > 1.5) return 'Right'
  return 'Center'
}

export function detectAbove(ballPos: BallPos[], hoopPos: HoopPos[]): boolean {
  if (ballPos.length < 3 || hoopPos.length === 0) return false

  const hoop = hoopPos[hoopPos.length - 1]
  const ball = ballPos[ballPos.length - 1]

  const inX = hoop.cx - 4 * hoop.w < ball.cx && ball.cx < hoop.cx + 4 * hoop.w
  const inY = hoop.cy - 2 * hoop.h < ball.cy && ball.cy < hoop.cy

  if (!inX || !inY) return false

  const recent = ballPos.slice(-3)
  let upwardCount = 0
  for (let i = 1; i < recent.length; i++) {
    if (recent[i].cy < recent[i - 1].cy) upwardCount++
  }

  return upwardCount >= 1
}

export function detectBelow(ballPos: BallPos[], hoopPos: HoopPos[]): boolean {
  if (ballPos.length === 0 || hoopPos.length === 0) return false

  const hoop = hoopPos[hoopPos.length - 1]
  const ball = ballPos[ballPos.length - 1]

  return ball.cy > hoop.cy + 0.5 * hoop.h
}

export function detectShot(
  ballAbove: boolean,
  ballBelow: boolean,
  frameAbove: number,
  frameBelow: number,
): boolean {
  return ballAbove && ballBelow && frameAbove < frameBelow
}

export function detectMake(
  ballPos: BallPos[],
  savedHoop: HoopPos,
  frameAbove: number,
  frameBelow: number,
): boolean {
  const hoopCx = savedHoop.cx
  const hoopCy = savedHoop.cy
  const hoopW = savedHoop.w
  const hoopH = savedHoop.h

  // Method 1: trajectory check
  const postRimBalls = ballPos.filter(
    (b) => b.frame >= frameBelow && b.frame <= frameBelow + 12,
  )

  let trajectoryMake = false
  if (postRimBalls.length >= 2) {
    const maxLateralOffset = Math.max(
      ...postRimBalls.map((b) => Math.abs(b.cx - hoopCx)),
    )
    const stayedNarrow = maxLateralOffset < hoopW * 0.75

    const firstY = postRimBalls[0].cy
    const lastY = postRimBalls[postRimBalls.length - 1].cy
    const movedDown = lastY >= firstY

    const avgX =
      postRimBalls.reduce((sum, b) => sum + b.cx, 0) / postRimBalls.length
    const centered = Math.abs(avgX - hoopCx) < hoopW * 0.6

    trajectoryMake = stayedNarrow && movedDown && centered
  }

  // Method 2: disappearance check
  const shotBalls = ballPos.filter(
    (b) => b.frame >= frameAbove && b.frame <= frameBelow + 15,
  )

  let lastNearRim: BallPos | null = null
  for (let i = shotBalls.length - 1; i >= 0; i--) {
    const b = shotBalls[i]
    const nearV = hoopCy - 1.5 * hoopH < b.cy && b.cy < hoopCy
    const nearH = Math.abs(b.cx - hoopCx) < hoopW * 1.5
    if (nearV && nearH) {
      lastNearRim = b
      break
    }
  }

  let firstBelow: BallPos | null = null
  for (const b of shotBalls) {
    if (b.cy > hoopCy + 0.5 * hoopH) {
      firstBelow = b
      break
    }
  }

  let disappearanceMake = false
  if (lastNearRim && firstBelow) {
    const frameGap = firstBelow.frame - lastNearRim.frame
    const gapDetections = shotBalls.filter(
      (b) => b.frame > lastNearRim!.frame && b.frame < firstBelow!.frame,
    ).length
    const missingFrames = frameGap - gapDetections

    const nearHoopBelow = Math.abs(firstBelow.cx - hoopCx) < hoopW * 0.6
    disappearanceMake = missingFrames >= 3 && nearHoopBelow
  }

  return trajectoryMake || disappearanceMake
}

export class ShotDetector {
  private ballPos: BallPos[] = []
  private hoopPos: HoopPos[] = []
  private playerPos: PlayerPos[] = []

  private ballAbove = false
  private ballBelow = false
  private frameAbove = 0
  private frameBelow = 0
  private frameCount = 0
  private shotCooldown = 0

  private savedHoop: HoopPos | null = null
  private savedBallAtRelease: BallPos | null = null
  private savedPlayerAtRelease: PlayerPos | null = null

  public shotLog: Shot[] = []
  public fps: number

  constructor(fps: number = 60) {
    this.fps = fps
  }

  processDetections(
    ball: { cx: number; cy: number; w: number; h: number; conf: number } | null,
    hoop: { cx: number; cy: number; w: number; h: number; conf: number } | null,
    player: {
      cx: number
      cy: number
      w: number
      h: number
      conf: number
    } | null,
  ) {
    if (ball) {
      this.ballPos.push({ ...ball, frame: this.frameCount })
    }
    if (hoop) {
      this.hoopPos.push({ ...hoop, frame: this.frameCount })
    }
    if (player) {
      this.playerPos.push({ ...player, frame: this.frameCount })
    }

    if (this.ballPos.length > 120) this.ballPos.shift()
    if (this.hoopPos.length > 25) this.hoopPos.shift()
    if (this.playerPos.length > 10) this.playerPos.shift()

    if (this.shotCooldown > 0) {
      this.shotCooldown--
    } else if (this.hoopPos.length > 0 && this.ballPos.length > 0) {
      if (!this.ballAbove) {
        this.ballAbove = detectAbove(this.ballPos, this.hoopPos)
        if (this.ballAbove) {
          this.frameAbove = this.frameCount
          this.savedBallAtRelease = this.ballPos[this.ballPos.length - 1]
          this.savedHoop = this.hoopPos[this.hoopPos.length - 1]
          this.savedPlayerAtRelease =
            this.playerPos.length > 0
              ? this.playerPos[this.playerPos.length - 1]
              : null
        }
      }

      if (
        this.ballAbove &&
        !this.savedPlayerAtRelease &&
        this.playerPos.length > 0
      ) {
        this.savedPlayerAtRelease = this.playerPos[this.playerPos.length - 1]
      }

      if (this.ballAbove && !this.ballBelow && this.savedHoop) {
        this.ballBelow = detectBelow(this.ballPos, [this.savedHoop])
        if (this.ballBelow) {
          this.frameBelow = this.frameCount
        }
      }

      if (
        detectShot(
          this.ballAbove,
          this.ballBelow,
          this.frameAbove,
          this.frameBelow,
        )
      ) {
        if (this.frameCount - this.frameBelow >= 12) {
          const zone = getZone(
            this.savedBallAtRelease,
            this.savedPlayerAtRelease,
            this.savedHoop,
          )
          const made = this.savedHoop
            ? detectMake(
                this.ballPos,
                this.savedHoop,
                this.frameAbove,
                this.frameBelow,
              )
            : false
          const result = made ? 'MAKE' : 'MISS'
          const timestamp = frameToTimestamp(this.frameCount, this.fps)

          this.shotLog.push({
            frame: this.frameCount,
            timestamp,
            result,
            zone,
          })

          this.ballAbove = false
          this.ballBelow = false
          this.savedHoop = null
          this.savedBallAtRelease = null
          this.savedPlayerAtRelease = null
          this.shotCooldown = Math.floor(this.fps * 1.5)
        }
      }
    }

    this.frameCount++
  }

  getStats() {
    const makes = this.shotLog.filter((s) => s.result === 'MAKE').length
    const misses = this.shotLog.filter((s) => s.result === 'MISS').length
    return { total: this.shotLog.length, makes, misses }
  }

  reset() {
    this.ballPos = []
    this.hoopPos = []
    this.playerPos = []
    this.ballAbove = false
    this.ballBelow = false
    this.frameAbove = 0
    this.frameBelow = 0
    this.frameCount = 0
    this.shotCooldown = 0
    this.savedHoop = null
    this.savedBallAtRelease = null
    this.savedPlayerAtRelease = null
    this.shotLog = []
  }
}
