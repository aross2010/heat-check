import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useUserStore } from '../../../stores/user-store'
import { useAuth } from '../../../context/auth-context'
import Txt from '../../../components/text'
import SafeView from '../../../components/safe-view'
import { useEffect, useState } from 'react'
import { SplashScreen } from 'expo-router'
import { BASE_URL, HomeData } from '@heat-check/shared'
import { BasketballCourt } from '../../../components/basketball-court'

const Home = () => {
  const { user } = useUserStore()
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
  return (
    <SafeView>
      <Txt>Home</Txt>
      <BasketballCourt
        leftColor="#FF6B6B"
        middleColor="#4ECDC4"
        rightColor="#45B7D1"
        leftText="50%"
        middleText="25%"
        rightText="25%"
        textColor="white"
      />

      <Txt>{JSON.stringify(user)}</Txt>
      <Txt>{JSON.stringify(authUser)}</Txt>
      <Txt>{JSON.stringify(data)}</Txt>

      <Txt>{JSON.stringify(user)}</Txt>
      <Txt>{JSON.stringify(authUser)}</Txt>
      <Txt>{JSON.stringify(data)}</Txt>
    </SafeView>
  )
}

export default Home

const styles = StyleSheet.create({})
