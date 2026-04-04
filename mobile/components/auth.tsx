import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useAuth } from '../context/auth-context'
import { SplashScreen } from 'expo-router'
import { useEffect } from 'react'
import SafeView from './safe-view'
import Spinner from './spinner'
import tw from '../tw'
import Logo from '../assets/logo.svg'
import SignInWithGoogle from './sign-in-with-google'
import { SignInWithApple } from './sign-in-with-apple'

const Auth = () => {
  const { isLoading, signIn } = useAuth()

  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  return (
    <SafeView
      scroll={false}
      hasHeader={false}
      twcnContentView={`px-0 pb-0 ${isLoading ? 'relative opacity-50' : ''}`}
    >
      {isLoading && <Spinner overlay />}
      <View style={tw`flex-1 mt-24`}>
        <Logo
          width={256}
          height={256}
          style={tw`mx-auto mb-6`}
        />
      </View>

      <View style={tw`mt-auto items-center flex-col gap-2 pb-12 px-4`}>
        <SignInWithGoogle
          onPress={signIn}
          disabled={isLoading}
        />
        <SignInWithApple />
      </View>
    </SafeView>
  )
}

export default Auth

const styles = StyleSheet.create({})
