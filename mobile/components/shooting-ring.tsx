import { StyleSheet, View } from 'react-native'
import React from 'react'
import Txt from './text'
import tw from '../tw'
import Svg, { Circle } from 'react-native-svg'
import { percentageToColor } from '../functions/percentage-to-color'

const RING_SIZE = 148
const RING_STROKE = 12
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2
const RING_CIRC = 2 * Math.PI * RING_RADIUS

type ShootingRingProps = {
  percentage: number
}

const ShootingRing = ({ percentage }: ShootingRingProps) => {
  return (
    <View
      style={[
        tw`items-center justify-center`,
        { width: RING_SIZE, height: RING_SIZE },
      ]}
    >
      <Svg
        width={RING_SIZE}
        height={RING_SIZE}
        style={tw`absolute`}
      >
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke={tw.color('grayPrimary')}
          strokeWidth={RING_STROKE}
          fill="none"
        />
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke={percentageToColor(percentage)}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${RING_CIRC} ${RING_CIRC}`}
          strokeDashoffset={RING_CIRC * (1 - percentage / 100)}
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        />
      </Svg>
      <Txt twcn="font-bold text-4xl">
        {percentage.toFixed(0)}
        <Txt twcn="font-bold text-xl">%</Txt>
      </Txt>
      <Txt twcn="font-medium text-xs text-grayText mt-1 tracking-wider uppercase">
        Shooter
      </Txt>
    </View>
  )
}

export default ShootingRing

const styles = StyleSheet.create({})
