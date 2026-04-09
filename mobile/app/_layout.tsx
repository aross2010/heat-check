import { GestureHandlerRootView } from 'react-native-gesture-handler'
import React from 'react'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '../context/auth-context'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
})

const RootLayout = () => {
  return (
    <AuthProvider>
      <GestureHandlerRootView>
        <KeyboardProvider>
          <SafeAreaProvider>
            <BottomSheetModalProvider>
              <Stack
                screenOptions={{
                  headerBackButtonDisplayMode: 'minimal',
                  headerShown: false,
                }}
              >
                <Stack.Screen
                  name="index"
                  options={{ animation: 'none' }}
                />
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    animation: 'none',
                    headerBackButtonDisplayMode: 'minimal',
                  }}
                />
                <Stack.Screen
                  name="(modals)"
                  options={{
                    presentation: 'card',
                    headerShown: false,
                    animation: 'slide_from_bottom',
                    animationDuration: 350,
                    headerBackButtonDisplayMode: 'minimal',
                  }}
                />
              </Stack>
            </BottomSheetModalProvider>
          </SafeAreaProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  )
}

export default RootLayout
