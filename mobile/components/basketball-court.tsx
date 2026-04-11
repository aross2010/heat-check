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
  centerColor: string
  rightColor: string
  leftText?: string
  middleText?: string
  rightText?: string
  textColor?: string
}

export const BasketballCourt = ({
  leftColor,
  centerColor,
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
        width={150}
        height={470}
        fill={leftColor}
      />
      <Rect
        x={150}
        y={0}
        width={200}
        height={470}
        fill={centerColor}
      />
      <Rect
        x={350}
        y={0}
        width={150}
        height={470}
        fill={rightColor}
      />

      {/* Free throw lane (no top edge) */}
      <Line
        x1={150}
        y1={0}
        x2={150}
        y2={190}
        stroke="#000"
        strokeWidth={3}
      />
      <Line
        x1={350}
        y1={0}
        x2={350}
        y2={190}
        stroke="#000"
        strokeWidth={3}
      />
      <Line
        x1={150}
        y1={190}
        x2={350}
        y2={190}
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

      {/* Center circle */}
      <Path
        d="M 190 470 A 60 60 0 0 1 310 470"
        fill="none"
        stroke="#000"
        strokeWidth={3}
      />

      {/* Labels */}
      <SvgText
        x={90}
        y={117.5}
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
        x={410}
        y={117.5}
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
