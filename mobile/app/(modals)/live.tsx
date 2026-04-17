import { Alert, Linking, StyleSheet, View } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import {
  Camera,
  useCameraPermission,
  useCameraDevice,
  useCameraFormat,
} from 'react-native-vision-camera'
import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import Button from '../../components/button'
import tw from '../../tw'
import * as ScreenOrientation from 'expo-screen-orientation'
import SFIcon from '../../components/sf-icon'
import { BASE_URL, Colors } from '@heat-check/shared'
import { formatTime } from '../../functions/fomate-time'
import { useShotDetection } from '../../hooks/use-shot-detection'
import { useAuth } from '../../context/auth-context'

const LiveSession = () => {
  const { id } = useLocalSearchParams()
  const { hasPermission, requestPermission } = useCameraPermission()
  const device = useCameraDevice('back')
  const { fetchWithAuth } = useAuth()

  const format = useCameraFormat(device, [
    { videoResolution: { width: 1920, height: 1080 } },
    { fps: 60 },
  ])

  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const sessionStartRef = useRef<string | null>(null)

  const { frameProcessor, isRecordingShared, attempts, makes, currentStreak, shots } =
    useShotDetection()

  const toggleSession = async () => {
    if (isRecording) {
      clearInterval(timerRef.current!)
      isRecordingShared.value = false
      setIsRecording(false)

      const endTime = new Date().toISOString()
      try {
        await Promise.all([
          fetchWithAuth(`${BASE_URL}/api/sessions/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ startTime: sessionStartRef.current, endTime }),
          }),
          shots.length > 0
            ? fetchWithAuth(`${BASE_URL}/api/sessions/${id}/shots`, {
                method: 'POST',
                body: JSON.stringify({ shots }),
              })
            : Promise.resolve(),
        ])
      } catch (err) {
        console.error('Error saving session:', err)
      }

      router.replace(`/session?id=${id}`)
    } else {
      sessionStartRef.current = new Date().toISOString()
      setIsRecording(true)
      isRecordingShared.value = true
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1000)
      }, 1000)
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    const request = async () => {
      const granted = await requestPermission()
      if (!granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in Settings to use HeatCheck.',
          [
            { text: 'Cancel', onPress: () => router.back() },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        )
      }
    }
    request()
  }, [])

  useEffect(() => {
    if (!hasPermission || !device) return
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)
    return () => {
      ScreenOrientation.unlockAsync()
    }
  }, [hasPermission, device])

  if (!device) {
    return (
      <SafeView>
        <Txt>No camera device found.</Txt>
      </SafeView>
    )
  }

  const playStopButton = (
    <Button
      onPress={toggleSession}
      twcn="bg-gray-950/40 h-14 w-14 rounded-2xl flex-row items-center justify-center"
    >
      <SFIcon
        name={isRecording ? 'stop.fill' : 'play.fill'}
        size={20}
        color={Colors.background}
      />
    </Button>
  )

  const shotsDisplay = (
    <View
      style={tw`bg-gray-950/40 h-14 w-20 rounded-2xl flex-row items-center justify-center`}
    >
      <Txt twcn="text-xl font-bold text-primary">
        {makes}/{attempts}
      </Txt>
    </View>
  )

  const streak = (
    <View
      style={tw`bg-gray-950/40 h-14 w-20 rounded-2xl flex-row items-center justify-center`}
    >
      <Txt twcn="text-xl font-bold text-white">
        {currentStreak >= 0
          ? `🔥 ${currentStreak}`
          : `🧊 ${Math.abs(currentStreak)}`}
      </Txt>
    </View>
  )

  const timer = (
    <View
      style={tw`bg-gray-950/40 h-14 w-20 rounded-2xl flex-row items-center justify-center`}
    >
      <Txt twcn="text-xl font-bold text-white">{formatTime(elapsed)}</Txt>
    </View>
  )

  return (
    <View style={tw`flex-1 bg-black`}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        pixelFormat="rgb"
        format={format}
        fps={60}
      />
      <SafeView>
        <View style={tw`absolute top-6 left-16 flex-row items-center gap-2`}>
          {playStopButton}
          {timer}
          {shotsDisplay}
          {streak}
        </View>
      </SafeView>
    </View>
  )
}

export default LiveSession
