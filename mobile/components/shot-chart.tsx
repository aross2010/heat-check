import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { ShotChartData } from '@heat-check/shared'
import { BasketballCourt } from './basketball-court'
import { percentageToColor } from '../functions/percentage-to-color'
import tw from '../tw'

type ShotChartProps = {
  data: ShotChartData
}

const ShotChart = ({ data }: ShotChartProps) => {
  return (
    <View style={tw`rounded-2xl overflow-hidden`}>
      <BasketballCourt
        leftColor={percentageToColor((data.left.made / data.left.total) * 100)}
        centerColor={percentageToColor(
          (data.center.made / data.center.total) * 100,
        )}
        rightColor={percentageToColor(
          (data.right.made / data.right.total) * 100,
        )}
        leftText={`${((data.left.made / data.left.total) * 100).toFixed(1)}%`}
        middleText={`${((data.center.made / data.center.total) * 100).toFixed(1)}%`}
        rightText={`${((data.right.made / data.right.total) * 100).toFixed(1)}%`}
        textColor="#FFFFFF"
      />
    </View>
  )
}

export default ShotChart

const styles = StyleSheet.create({})
