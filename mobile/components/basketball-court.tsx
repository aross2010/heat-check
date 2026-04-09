import React from 'react'
import { View } from 'react-native'
import {
  Svg,
  Rect,
  Line,
  Path,
  Circle,
  Text as SvgText,
} from 'react-native-svg'

type BasketballCourtProps = {
  leftColor: string
  middleColor: string
  rightColor: string
  leftText?: string
  middleText?: string
  rightText?: string
  textColor?: string
}

export const BasketballCourt = ({
  leftColor,
  middleColor,
  rightColor,
  leftText = '',
  middleText = '',
  rightText = '',
  textColor = '#000000',
}: BasketballCourtProps) => (
  <View style={{ width: '100%', aspectRatio: 500 / 470 }}>
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 500 470"
    >
      {/* Section backgrounds */}
      <Rect
        x={0}
        y={0}
        width={166.66}
        height={470}
        fill={leftColor}
      />
      <Rect
        x={166.66}
        y={0}
        width={166.66}
        height={470}
        fill={middleColor}
      />
      <Rect
        x={333.33}
        y={0}
        width={166.66}
        height={470}
        fill={rightColor}
      />

      {/* Baseline (top) */}
      <Line
        x1={0}
        y1={0}
        x2={500}
        y2={0}
        stroke="#000"
        strokeWidth={3}
      />

      {/* Free throw lane */}
      <Rect
        x={150}
        y={0}
        width={200}
        height={190}
        fill="none"
        stroke="#000"
        strokeWidth={3}
      />

      {/* Free throw circle top half */}
      <Path
        d="M 150 190 A 100 100 0 0 0 350 190"
        fill="none"
        stroke="#000"
        strokeWidth={3}
      />

      {/* Free throw circle bottom half (dashed) */}
      <Path
        d="M 150 190 A 100 100 0 0 1 350 190"
        fill="none"
        stroke="#000"
        strokeWidth={3}
        strokeDasharray="10,5"
      />

      {/* 3-point line */}
      <Line
        x1={30}
        y1={0}
        x2={30}
        y2={165}
        stroke="#000"
        strokeWidth={3}
      />
      <Line
        x1={470}
        y1={0}
        x2={470}
        y2={165}
        stroke="#000"
        strokeWidth={3}
      />
      <Path
        d="M 30 165 A 237.5 237.5 0 0 0 470 165"
        fill="none"
        stroke="#000"
        strokeWidth={3}
      />

      {/* Hoop */}
      <Circle
        cx={250}
        cy={40}
        r={9}
        fill="none"
        stroke="#000"
        strokeWidth={2}
      />

      {/* Half-court line */}
      <Line
        x1={0}
        y1={470}
        x2={500}
        y2={470}
        stroke="#000"
        strokeWidth={3}
      />

      {/* Center circle */}
      <Path
        d="M 190 470 A 60 60 0 0 1 310 470"
        fill="none"
        stroke="#000"
        strokeWidth={3}
      />

      {/* Labels */}
      <SvgText
        x={83}
        y={235}
        textAnchor="middle"
        fill={textColor}
        fontSize={24}
        fontWeight="bold"
      >
        {leftText}
      </SvgText>
      <SvgText
        x={250}
        y={235}
        textAnchor="middle"
        fill={textColor}
        fontSize={24}
        fontWeight="bold"
      >
        {middleText}
      </SvgText>
      <SvgText
        x={416}
        y={235}
        textAnchor="middle"
        fill={textColor}
        fontSize={24}
        fontWeight="bold"
      >
        {rightText}
      </SvgText>
    </Svg>
  </View>
)
