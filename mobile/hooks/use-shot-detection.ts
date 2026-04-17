import { useFrameProcessor } from 'react-native-vision-camera'
import { useTensorflowModel } from 'react-native-fast-tflite'
import { useResizePlugin } from 'vision-camera-resize-plugin'
import { useSharedValue, useRunOnJS } from 'react-native-worklets-core'
import { useState } from 'react'
import { ShotLocation } from '@heat-check/shared'

// ─── Types ───────────────────────────────────────────────────
export type PosEntry = {
  cx: number
  cy: number
  frame: number
  w: number
  h: number
  conf: number
}

export type ShotResult = 'MAKE' | 'MISS'

export type ShotEntry = {
  made: boolean
  shotLocation: ShotLocation
  takenAt: string
}
const INPUT_SIZE = 640
const NUM_ANCHORS = 8400
const BALL_IDX = 1
const HOOP_IDX = 2
const PLAYER_IDX = 3

const BALL_CONF_THRESHOLD = 0.2
const HOOP_CONF_THRESHOLD = 0.5
const PLAYER_CONF_THRESHOLD = 0.4

const WAIT_AFTER_BELOW = 4
const POST_RIM_WINDOW = 7
const SHOT_WINDOW_EXTRA = 7
const SHOT_COOLDOWN = 33
const ABOVE_TIMEOUT = 30
const VANISH_FRAMES = 5

const toRealArray = (maybeArr: any): PosEntry[] => {
  'worklet'
  const out: PosEntry[] = []
  if (!maybeArr) return out
  const len = maybeArr.length ?? 0
  for (let i = 0; i < len; i++) {
    const v = maybeArr[i]
    if (v) out.push(v)
  }
  return out
}

export const useShotDetection = () => {
  const [attempts, setAttempts] = useState(0)
  const [makes, setMakes] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [shots, setShots] = useState<ShotEntry[]>([])

  const model = useTensorflowModel(
    require('../model/best_float32.tflite'),
    'core-ml',
  )
  const { resize } = useResizePlugin()

  const isRecordingShared = useSharedValue(false)
  const ballPos = useSharedValue<PosEntry[]>([])
  const hoopPos = useSharedValue<PosEntry[]>([])
  const playerPos = useSharedValue<PosEntry[]>([])
  const ballAbove = useSharedValue(false)
  const ballBelow = useSharedValue(false)
  const frameAbove = useSharedValue(0)
  const frameBelow = useSharedValue(0)
  const frameCount = useSharedValue(0)
  const shotCooldown = useSharedValue(0)
  const savedHoop = useSharedValue<PosEntry | null>(null)
  const savedBallAtRelease = useSharedValue<PosEntry | null>(null)
  const savedPlayerAtRelease = useSharedValue<PosEntry | null>(null)

  const onShotDetected = (result: ShotResult, location: ShotLocation) => {
    setShots((prev) => [
      ...prev,
      { made: result === 'MAKE', shotLocation: location, takenAt: new Date().toISOString() },
    ])
    setAttempts((prev) => prev + 1)
    if (result === 'MAKE') {
      setMakes((prev) => prev + 1)
      setCurrentStreak((prev) => (prev >= 0 ? prev + 1 : 1))
    } else {
      setCurrentStreak((prev) => (prev <= 0 ? prev - 1 : -1))
    }
  }

  const notifyShot = useRunOnJS((result: ShotResult, location: ShotLocation) => {
    onShotDetected(result, location)
  }, [])

  const logStage = useRunOnJS((stage: string, detail: string) => {
    console.log('stage —' + stage + ' — ' + detail)
  }, [])

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet'
      if (model.state !== 'loaded') return
      if (!isRecordingShared.value) return

      // resize full frame to model input size
      const resized = resize(frame, {
        scale: { width: INPUT_SIZE, height: INPUT_SIZE },
        crop: {
          x: 0,
          y: 0,
          width: frame.width,
          height: frame.height,
        },
        pixelFormat: 'rgb',
        dataType: 'float32',
        rotation: '0deg',
      })

      const output = model.model.runSync([resized])
      const data = output[0] as unknown as Float32Array

      let ball: PosEntry | null = null
      let hoop: PosEntry | null = null
      let player: PosEntry | null = null
      let bestBallConf = BALL_CONF_THRESHOLD
      let bestHoopConf = HOOP_CONF_THRESHOLD
      let bestPlayerConf = PLAYER_CONF_THRESHOLD

      for (let i = 0; i < NUM_ANCHORS; i++) {
        const x = data[0 * NUM_ANCHORS + i] * INPUT_SIZE
        const y = data[1 * NUM_ANCHORS + i] * INPUT_SIZE
        const w = data[2 * NUM_ANCHORS + i] * INPUT_SIZE
        const h = data[3 * NUM_ANCHORS + i] * INPUT_SIZE
        const ballConf = data[(4 + BALL_IDX) * NUM_ANCHORS + i]
        const hoopConf = data[(4 + HOOP_IDX) * NUM_ANCHORS + i]
        const playerConf = data[(4 + PLAYER_IDX) * NUM_ANCHORS + i]

        if (ballConf > bestBallConf) {
          bestBallConf = ballConf
          ball = { cx: x, cy: y, w, h, conf: ballConf, frame: 0 }
        }
        if (hoopConf > bestHoopConf) {
          bestHoopConf = hoopConf
          hoop = { cx: x, cy: y, w, h, conf: hoopConf, frame: 0 }
        }
        if (playerConf > bestPlayerConf) {
          bestPlayerConf = playerConf
          player = { cx: x, cy: y, w, h, conf: playerConf, frame: 0 }
        }
      }

      const fc = frameCount.value

      const bp = toRealArray(ballPos.value)
      const hp = toRealArray(hoopPos.value)
      const pp = toRealArray(playerPos.value)

      if (ball) {
        ball.frame = fc
        bp.push(ball)
        if (bp.length > 120) bp.splice(0, bp.length - 120)
      }
      if (hoop) {
        hoop.frame = fc
        hp.push(hoop)
        if (hp.length > 25) hp.splice(0, hp.length - 25)
      }
      if (player) {
        player.frame = fc
        pp.push(player)
        if (pp.length > 10) pp.splice(0, pp.length - 10)
      }

      ballPos.value = bp
      hoopPos.value = hp
      playerPos.value = pp

      if (shotCooldown.value > 0) {
        shotCooldown.value--
        frameCount.value++
        return
      }

      if (
        ballAbove.value &&
        !ballBelow.value &&
        fc - frameAbove.value > ABOVE_TIMEOUT
      ) {
        ballAbove.value = false
        savedHoop.value = null
        savedBallAtRelease.value = null
        savedPlayerAtRelease.value = null
      }

      if (hp.length === 0 || bp.length === 0) {
        frameCount.value++
        return
      }

      // stage 1: detect ball above hoop
      if (!ballAbove.value) {
        const hoop_ = hp[hp.length - 1]
        const ball_ = bp[bp.length - 1]
        const inX =
          hoop_.cx - 4 * hoop_.w < ball_.cx && ball_.cx < hoop_.cx + 4 * hoop_.w
        const inY = hoop_.cy - 2 * hoop_.h < ball_.cy && ball_.cy < hoop_.cy

        if (inX && inY && bp.length >= 3) {
          let upCount = 0
          const start = bp.length - 3
          for (let i = start + 1; i < bp.length; i++) {
            if (bp[i].cy < bp[i - 1].cy) upCount++
          }
          if (upCount >= 1) {
            ballAbove.value = true
            frameAbove.value = fc
            savedBallAtRelease.value = bp[bp.length - 1]
            savedHoop.value = hp[hp.length - 1]
            savedPlayerAtRelease.value =
              pp.length > 0 ? pp[pp.length - 1] : null
          }
        }
      }

      if (ballAbove.value && !savedPlayerAtRelease.value && pp.length > 0) {
        savedPlayerAtRelease.value = pp[pp.length - 1]
      }

      // stage 2: detect ball below hoop
      if (ballAbove.value && !ballBelow.value && savedHoop.value) {
        const sh = savedHoop.value
        const ball_ = bp[bp.length - 1]
        const lastBallFrame = bp.length > 0 ? bp[bp.length - 1].frame : 0

        if (ball_.cy > sh.cy) {
          ballBelow.value = true
          frameBelow.value = fc
        } else if (fc - lastBallFrame >= VANISH_FRAMES) {
          ballBelow.value = true
          frameBelow.value = fc
        }
      }

      // ── Stage 3: Classify Make/Miss ──────────────────────
      if (
        ballAbove.value &&
        ballBelow.value &&
        frameAbove.value < frameBelow.value
      ) {
        if (fc - frameBelow.value >= WAIT_AFTER_BELOW) {
          const sh = savedHoop.value!
          const hoopCx = sh.cx
          const hoopCy = sh.cy
          const hoopW = sh.w
          const hoopH = sh.h
          const fa = frameAbove.value
          const fb = frameBelow.value

          const postRimBalls: PosEntry[] = []
          for (let i = 0; i < bp.length; i++) {
            const b = bp[i]
            if (b.frame >= fb && b.frame <= fb + POST_RIM_WINDOW) {
              postRimBalls.push(b)
            }
          }

          let trajectoryMake = false
          if (postRimBalls.length >= 2) {
            let maxLateral = 0
            let sumX = 0
            for (let i = 0; i < postRimBalls.length; i++) {
              const b = postRimBalls[i]
              const offset = Math.abs(b.cx - hoopCx)
              if (offset > maxLateral) maxLateral = offset
              sumX += b.cx
            }
            const stayedNarrow = maxLateral < hoopW * 0.75
            const movedDown =
              postRimBalls[postRimBalls.length - 1].cy >= postRimBalls[0].cy
            const centered =
              Math.abs(sumX / postRimBalls.length - hoopCx) < hoopW * 0.6
            trajectoryMake = stayedNarrow && movedDown && centered
          }

          const shotBalls: PosEntry[] = []
          for (let i = 0; i < bp.length; i++) {
            const b = bp[i]
            if (b.frame >= fa && b.frame <= fb + SHOT_WINDOW_EXTRA) {
              shotBalls.push(b)
            }
          }

          let lastNearRim: PosEntry | null = null
          for (let i = shotBalls.length - 1; i >= 0; i--) {
            const b = shotBalls[i]
            const nearV = hoopCy - 1.5 * hoopH < b.cy && b.cy < hoopCy
            const nearH = Math.abs(b.cx - hoopCx) < hoopW * 1.5
            if (nearV && nearH) {
              lastNearRim = b
              break
            }
          }
          let firstBelow: PosEntry | null = null
          for (let i = 0; i < shotBalls.length; i++) {
            const b = shotBalls[i]
            if (b.cy > hoopCy + 0.5 * hoopH) {
              firstBelow = b
              break
            }
          }

          let disappearanceMake = false
          if (lastNearRim && firstBelow) {
            const frameGap = firstBelow.frame - lastNearRim.frame
            let gapDetections = 0
            for (let i = 0; i < shotBalls.length; i++) {
              const b = shotBalls[i]
              if (b.frame > lastNearRim.frame && b.frame < firstBelow.frame) {
                gapDetections++
              }
            }
            const missingFrames = frameGap - gapDetections
            const nearHoopBelow = Math.abs(firstBelow.cx - hoopCx) < hoopW * 0.6
            disappearanceMake = missingFrames >= 3 && nearHoopBelow
          }

          let vanishMake = false
          if (postRimBalls.length === 0 && bp.length > 0) {
            let lastBall: PosEntry | null = null
            for (let i = bp.length - 1; i >= 0; i--) {
              if (bp[i].frame >= fa && bp[i].frame <= fb) {
                lastBall = bp[i]
                break
              }
            }
            if (lastBall) {
              const nearHoopX = Math.abs(lastBall.cx - hoopCx) < hoopW * 0.8
              const nearHoopY = Math.abs(lastBall.cy - hoopCy) < hoopH * 2
              vanishMake = nearHoopX && nearHoopY
            }
          }

          const made = trajectoryMake || disappearanceMake || vanishMake

          const bx = savedBallAtRelease.value ? savedBallAtRelease.value.cx : hoopCx
          const offset = bx - hoopCx
          const loc: ShotLocation =
            offset < -hoopW * 0.4 ? 'left' : offset > hoopW * 0.4 ? 'right' : 'center'

          notifyShot(made ? 'MAKE' : 'MISS', loc)

          ballAbove.value = false
          ballBelow.value = false
          savedHoop.value = null
          savedBallAtRelease.value = null
          savedPlayerAtRelease.value = null
          shotCooldown.value = SHOT_COOLDOWN
        }
      }

      frameCount.value++
    },
    [model],
  )

  return {
    frameProcessor,
    isRecordingShared,
    attempts,
    makes,
    currentStreak,
    shots,
    modelState: model.state,
  }
}
