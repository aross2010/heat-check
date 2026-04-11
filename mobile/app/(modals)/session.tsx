import { StyleSheet, View } from 'react-native'
import React, { useEffect, useState, useMemo } from 'react'
import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import {
  BASE_URL,
  Colors,
  Session as SessionType,
  ShotChartData as ShotChartDataType,
} from '@heat-check/shared'
import { useAuth } from '../../context/auth-context'
import Spinner from '../../components/spinner'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import ShotChart from '../../components/shot-chart'
import { formatDate } from '../../functions/fromat-date'
import { formatTime } from '../../functions/fomate-time'
import tw from '../../tw'
import SFIcon from '../../components/sf-icon'
import { toTitleCase } from '../../functions/title-case'
import { percentageToColor } from '../../functions/percentage-to-color'

const Session = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<SessionType | null>(null)
  const { fetchWithAuth, authUser } = useAuth()
  const { id } = useLocalSearchParams()
  const navigation = useNavigation()

  const getSessionData = async () => {
    try {
      const res = await fetchWithAuth(`${BASE_URL}/api/sessions/${id}`, {
        method: 'GET',
      })
      const data = (await res.json()) as SessionType
      setData(data)
    } catch (error) {
      console.error('Error fetching session data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    navigation.setOptions({
      title: data?.name || 'Session Details',
    })
  }, [data])

  useEffect(() => {
    getSessionData()
  }, [])

  const additionalData = useMemo(() => {
    const shots: ShotChartDataType = {
      left: { made: 0, total: 0 },
      center: { made: 0, total: 0 },
      right: { made: 0, total: 0 },
    }
    let hotStreak = 0
    let coldStreak = 0
    let currentHotStreak = 0
    let currentColdStreak = 0
    data?.shots.forEach((shot) => {
      shots[shot.shotLocation].total += 1
      if (shot.made) {
        shots[shot.shotLocation].made += 1
        currentHotStreak += 1
        currentColdStreak = 0
      } else {
        currentColdStreak += 1
        currentHotStreak = 0
      }
      hotStreak = Math.max(hotStreak, currentHotStreak)
      coldStreak = Math.max(coldStreak, currentColdStreak)
    })
    const total = shots.left.total + shots.center.total + shots.right.total
    const made = shots.left.made + shots.center.made + shots.right.made
    const shootingPercentage = total > 0 ? ((made / total) * 100).toFixed(1) : 0
    return {
      shotChartData: shots,
      hotStreak,
      coldStreak,
      shootingPercentage,
      made: shots['left'].made + shots['center'].made + shots['right'].made,
    }
  }, [data])

  const sessionTime = useMemo(() => {
    const start = data?.startedAt
    const end = data?.endedAt
    if (!start || !end) return 0
    const ms = new Date(end).getTime() - new Date(start).getTime()
    return formatTime(ms)
  }, [data])

  const renderedShots =
    data &&
    data.shots.map((shot, index) => {
      const elapsed =
        new Date(shot.takenAt).getTime() - new Date(data.startedAt).getTime()
      return (
        <View
          key={shot.id}
          style={tw`flex-row py-2 border-b border-grayBorder`}
        >
          <View style={tw`flex-1 items-center`}>
            <Txt>{index + 1}</Txt>
          </View>
          <View style={tw`flex-1 items-center`}>
            <Txt>{formatTime(elapsed)}</Txt>
          </View>
          <View style={tw`flex-1 items-center`}>
            {shot.made ? (
              <SFIcon
                name="checkmark"
                color={Colors.green}
                size={16}
              />
            ) : (
              <SFIcon
                name="xmark"
                color={Colors.red}
                size={16}
              />
            )}
          </View>
          <View style={tw`flex-1 items-center justify-center`}>
            <View style={tw`flex-row items-center justify-center gap-1`}>
              <SFIcon
                name="circle.fill"
                color={
                  shot.shotLocation === 'left'
                    ? Colors.primary
                    : Colors.grayPrimary
                }
                size={10}
              />
              <SFIcon
                name="circle.fill"
                color={
                  shot.shotLocation === 'center'
                    ? Colors.primary
                    : Colors.grayPrimary
                }
                size={10}
              />
              <SFIcon
                name="circle.fill"
                color={
                  shot.shotLocation === 'right'
                    ? Colors.primary
                    : Colors.grayPrimary
                }
                size={10}
              />
            </View>
          </View>
        </View>
      )
    })

  const shotsTable = (
    <View>
      <Txt twcn="font-semibold text-xl mb-2">Shots</Txt>
      <View style={tw`flex-row py-2 border-b border-grayBorder`}>
        <View style={tw`flex-1 items-center`}>
          <Txt twcn="text-grayText">#</Txt>
        </View>
        <View style={tw`flex-1 items-center`}>
          <Txt twcn="text-grayText">Time</Txt>
        </View>
        <View style={tw`flex-1 items-center`}>
          <Txt twcn="text-grayText">Result</Txt>
        </View>
        <View style={tw`flex-1 items-center`}>
          <Txt twcn="text-grayText">Location</Txt>
        </View>
      </View>
      {renderedShots}
    </View>
  )

  const keyStats = data && (
    <View>
      <Txt twcn="text-lg text-center">
        {formatDate(data?.date || new Date())}
      </Txt>
      <View style={tw`flex-row mt-4`}>
        <View style={tw`flex-1 items-center`}>
          <Txt twcn="text-xs uppercase tracking-wider text-grayText mb-1">
            Duration
          </Txt>
          <Txt twcn="text-lg font-bold tabular-nums">{sessionTime}</Txt>
        </View>

        <View style={tw`flex-1 items-center`}>
          <Txt twcn="text-xs uppercase tracking-wider text-grayText mb-1">
            Hot Streak
          </Txt>
          <Txt twcn="text-lg font-bold">{additionalData.hotStreak} 🔥</Txt>
        </View>

        <View style={tw`flex-1 items-center`}>
          <Txt twcn="text-xs uppercase tracking-wider text-grayText mb-1">
            Cold Streak
          </Txt>
          <Txt twcn="text-lg font-bold">{additionalData.coldStreak} ❄️</Txt>
        </View>
      </View>
      <View style={tw`flex-row mt-4`}>
        <View style={tw`flex-1 items-center`}>
          <Txt twcn="text-xs uppercase tracking-wider text-grayText mb-1">
            Made
          </Txt>
          <Txt twcn="text-lg font-bold">{additionalData.made}</Txt>
        </View>

        <View style={tw`flex-1 items-center`}>
          <Txt twcn="text-xs uppercase tracking-wider text-grayText mb-1">
            Missed
          </Txt>
          <Txt twcn="text-lg font-bold">
            {data.shots.length - additionalData.made}
          </Txt>
        </View>

        <View style={tw`flex-1 items-center`}>
          <Txt twcn="text-xs uppercase tracking-wider text-grayText mb-1">
            Shots
          </Txt>
          <Txt twcn="text-lg font-bold tabular-nums">{data.shots.length}</Txt>
        </View>

        <View style={tw`flex-1 items-center`}>
          <Txt twcn="text-xs uppercase tracking-wider text-grayText mb-1">
            Percentage
          </Txt>
          <Txt twcn="text-lg font-bold">
            {additionalData.shootingPercentage}%
          </Txt>
        </View>
      </View>
    </View>
  )

  if (isLoading) return <Spinner fullScreen />

  return (
    <SafeView twcnContentView="gap-6">
      {keyStats}
      <ShotChart data={additionalData.shotChartData} />
      {shotsTable}
    </SafeView>
  )
}

export default Session

const styles = StyleSheet.create({})
