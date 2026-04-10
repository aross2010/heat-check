import { View } from 'react-native'
import React from 'react'
import Svg, { Circle } from 'react-native-svg'
import { useAuth } from '../../../context/auth-context'
import Txt from '../../../components/text'
import SafeView from '../../../components/safe-view'
import { useEffect, useState } from 'react'
import { SplashScreen } from 'expo-router'
import { BASE_URL, Colors, HomeData } from '@heat-check/shared'
import tw from '../../../tw'
import Button from '../../../components/button'
import SFIcon from '../../../components/sf-icon'
import { formatNumber } from '../../../functions/format-numbers'
import { GlassView } from 'expo-glass-effect'

const Home = () => {
  const { authUser, fetchWithAuth } = useAuth()
  const [data, setData] = useState<HomeData | null>(null)

  const getHomeData = async () => {
    if (!authUser?.id) return
    try {
      const res = await fetchWithAuth(`${BASE_URL}/api/home/${authUser.id}`, {
        method: 'GET',
      })
      const data = await res.json()
      setData(data)
    } catch (error) {
      console.error('Error fetching home data:', error)
    }
  }

  useEffect(() => {
    if (!authUser?.id) return
    SplashScreen.hideAsync()
    getHomeData()
  }, [authUser?.id])

  const percentageToColor = (percentage: number) => {
    if (percentage >= 50) return Colors.green
    if (percentage >= 30) return Colors.yellow
    return Colors.red
  }

  const RING_SIZE = 148
  const RING_STROKE = 12
  const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2
  const RING_CIRC = 2 * Math.PI * RING_RADIUS

  const renderedTopStats = data && (
    <View style={tw`flex-row items-center justify-between px-2 mt-2 mb-2`}>
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
            stroke={tw.color('light-grayPrimary')}
            strokeWidth={RING_STROKE}
            fill="none"
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={percentageToColor(data.stats.shootingPercentage)}
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${RING_CIRC} ${RING_CIRC}`}
            strokeDashoffset={
              RING_CIRC * (1 - data.stats.shootingPercentage / 100)
            }
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        </Svg>
        <Txt twcn="font-bold text-4xl text-light-text">
          {data.stats.shootingPercentage.toFixed(0)}
          <Txt twcn="font-medium text-xl text-light-grayText">%</Txt>
        </Txt>
        <Txt twcn="font-medium text-xs text-light-grayText mt-1 tracking-wider uppercase">
          Shooter
        </Txt>
      </View>

      <View style={tw`flex-1 items-center gap-2`}>
        <View style={tw`items-center`}>
          <Txt twcn="font-medium text-xs text-light-grayText uppercase tracking-wider">
            Makes
          </Txt>
          <Txt twcn="font-bold text-2xl text-light-text">
            {formatNumber(Number(data.stats.totalMakes) || 0)}
          </Txt>
        </View>
        <View style={tw`h-px bg-light-grayBorder`} />
        <View style={tw`items-center`}>
          <Txt twcn="font-medium text-xs text-light-grayText uppercase tracking-wider">
            Misses
          </Txt>
          <Txt twcn="font-bold text-2xl text-light-text">
            {formatNumber(data.stats.totalMisses)}
          </Txt>
        </View>
        <View style={tw`h-px bg-light-grayBorder`} />
        <View style={tw`items-center`}>
          <Txt twcn="font-medium text-xs text-light-grayText uppercase tracking-wider">
            Shots
          </Txt>
          <Txt twcn="font-bold text-2xl text-light-text">
            {formatNumber(data.stats.totalShots)}
          </Txt>
        </View>
      </View>
    </View>
  )

  const prevSessions = (
    <View>
      <Txt twcn="font-bold text-xl mb-2">Previous Sessions</Txt>
      <View>
        {data?.previousSessions.map((session) => {
          return (
            <Button
              onPress={() => {
                // TODO: open modal with shot chart + in depth stats
              }}
              twcn=" border-b border-light-grayBorder p-4 flex-row justify-between items-center"
              key={session.id}
            >
              <View>
                <Txt twcn="font-semibold">
                  {session.name && `${session.name} • `}
                  {session.date}
                </Txt>
                <Txt twcn="text-sm">
                  {session.shootingPercentage.toFixed(1)}% shooting •{' '}
                  {formatNumber(session.totalShots)} shots
                </Txt>
              </View>
              <SFIcon
                name="chevron.right"
                color={Colors.primary}
                size={16}
              />
            </Button>
          )
        })}
      </View>
    </View>
  )

  return (
    <View style={tw`flex-1`}>
      <SafeView twcnContentView="gap-6">
        {renderedTopStats}
        {prevSessions}
      </SafeView>
      <GlassView
        tintColor={Colors.primary}
        style={tw` absolute bottom-24 right-8 w-14 h-14 rounded-full items-center justify-center shadow-2xl`}
      >
        <Button
          onPress={() => {
            // TODO: start new session
          }}
        >
          <SFIcon
            name="plus"
            color="white"
            size={28}
          />
        </Button>
      </GlassView>
    </View>
  )
}

export default Home
