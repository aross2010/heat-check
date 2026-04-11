import { Alert, Linking, StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import {
  Camera,
  useCameraPermission,
  useCameraDevice,
} from 'react-native-vision-camera'
import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import Button from '../../components/button'
import tw from '../../tw'
import * as ScreenOrientation from 'expo-screen-orientation'

const LiveSession = () => {
  const { id } = useLocalSearchParams()
  const { hasPermission, requestPermission } = useCameraPermission()
  const device = useCameraDevice('back')

  const endSession = async () => {}

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
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT)
    }
  }, [hasPermission, device])

  if (!device) {
    return (
      <SafeView>
        <Txt>No camera device found.</Txt>
      </SafeView>
    )
  }

  return (
    <View style={tw`flex-1 bg-black`}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
      />
      <SafeView>
        {' '}
        <Button
          onPress={endSession}
          text="End"
        />
      </SafeView>
    </View>
  )
}

export default LiveSession

const styles = StyleSheet.create({})
