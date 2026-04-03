import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useAuth } from '../context/auth-context'
import { SplashScreen } from 'expo-router'
import { useEffect } from 'react'
import SafeView from './safe-view'
import Spinner from './spinner'

const Auth = () => {
  const { signIn, isLoading } = useAuth()

  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  return (
    <SafeView
      scroll={false}
      hasHeader={false}
      twcnContentView={`px-0 pb-0 ${isLoading ? 'relative' : ''}`}
    >
      {isLoading && <Spinner overlay />}
    </SafeView>
  )
}

export default Auth

const styles = StyleSheet.create({})
