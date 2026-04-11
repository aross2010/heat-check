import { View } from 'react-native'
import React from 'react'
import { useAuth } from '../../../context/auth-context'
import Txt from '../../../components/text'
import SafeView from '../../../components/safe-view'
import { useEffect, useState } from 'react'
import { router, SplashScreen } from 'expo-router'
import { BASE_URL, Colors, HomeData } from '@heat-check/shared'
import tw from '../../../tw'
import Button from '../../../components/button'
import SFIcon from '../../../components/sf-icon'
import { formatNumber } from '../../../functions/format-numbers'
import { GlassView } from 'expo-glass-effect'
import ShootingRing from '../../../components/shooting-ring'
import Spinner from '../../../components/spinner'
import { formatDate } from '../../../functions/fromat-date'

const Home = () => {
  const { authUser, fetchWithAuth } = useAuth()
  const [data, setData] = useState<HomeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const getHomeData = async () => {
    if (!authUser?.id) return
    try {
      const res = await fetchWithAuth(`${BASE_URL}/api/home/${authUser.id}`, {
        method: 'GET',
      })
      const data = (await res.json()) as HomeData
      if (data.previousSessions.length != 0) {
        setData(data)
      }
    } catch (error) {
      console.error('Error fetching home data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!authUser?.id) return
    SplashScreen.hideAsync()
    getHomeData()
  }, [authUser?.id])

  const topStats = data && [
    {
      label: 'Makes',
      value: formatNumber(Number(data.stats.totalMakes) || 0),
    },
    {
      label: 'Misses',
      value: formatNumber(data.stats.totalMisses),
    },
    {
      label: 'Shots',
      value: formatNumber(data.stats.totalShots),
    },
  ]

  const renderedTopStats = data && (
    <View style={tw`flex-row items-center justify-between px-2 mt-2 mb-2`}>
      <ShootingRing percentage={data.stats.shootingPercentage} />
      <View style={tw`flex-1 items-center gap-3`}>
        {topStats?.map((stat) => {
          return (
            <View
              style={tw`items-center`}
              key={stat.label}
            >
              <Txt twcn="text-xs font-medium text-grayText uppercase tracking-wider">
                {stat.label}
              </Txt>
              <Txt twcn="font-bold text-2xl">{stat.value}</Txt>
            </View>
          )
        })}
      </View>
    </View>
  )

  const prevSessions = data && (
    <View>
      <Txt twcn="font-bold text-xl mb-2">Previous Sessions</Txt>
      <View>
        {data?.previousSessions.map(
          ({ id, name, date, shootingPercentage, totalShots }) => {
            return (
              <Button
                onPress={() => {
                  // TODO: open modal with shot chart + in depth stats
                  router.push(`/session?id=${id}`)
                }}
                twcn=" border-b border-grayBorder p-4 flex-row justify-between items-center"
                key={id}
              >
                <View style={tw`gap-1`}>
                  <Txt twcn="font-semibold">
                    {name && `${name} • `}
                    {formatDate(date)}
                  </Txt>
                  <Txt twcn="text-sm text-grayText">
                    {shootingPercentage.toFixed(1)}% •{' '}
                    {formatNumber(totalShots)} shots
                  </Txt>
                </View>
                <SFIcon
                  name="chevron.right"
                  color={Colors.grayText}
                  size={16}
                />
              </Button>
            )
          },
        )}
      </View>
    </View>
  )

  const newSessionButton = (
    <GlassView
      tintColor={Colors.primary}
      style={tw` absolute bottom-24 right-8 w-14 h-14 rounded-full items-center justify-center shadow-2xl`}
    >
      <Button
        onPress={() => {
          // TODO: start new session
          router.push('/session-form')
        }}
      >
        <SFIcon
          name="plus"
          color="white"
          size={28}
        />
      </Button>
    </GlassView>
  )

  if (isLoading) return <Spinner fullScreen />

  return (
    <View style={tw`flex-1`}>
      <SafeView twcnContentView="gap-6">
        {renderedTopStats}
        {prevSessions}
      </SafeView>
      {newSessionButton}
    </View>
  )
}

export default Home
