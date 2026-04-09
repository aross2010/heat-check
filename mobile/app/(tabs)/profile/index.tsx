import { StyleSheet } from 'react-native'
import React from 'react'
import { useUserStore } from '../../../stores/user-store'
import { useAuth } from '../../../context/auth-context'
import Txt from '../../../components/text'
import SafeView from '../../../components/safe-view'
import Button from '../../../components/button'

const Profile = () => {
  const { user } = useUserStore()
  const { authUser, signOut } = useAuth()
  return (
    <SafeView>
      <Txt>Profile</Txt>
      <Txt>{JSON.stringify(user)}</Txt>
      <Txt>{JSON.stringify(authUser)}</Txt>
      <Button
        onPress={signOut}
        text="Sign Out"
      />
    </SafeView>
  )
}

export default Profile

const styles = StyleSheet.create({})
