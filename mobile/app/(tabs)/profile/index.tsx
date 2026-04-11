import { Pressable, View } from 'react-native'
import React from 'react'
import { useUserStore } from '../../../stores/user-store'
import { useAuth } from '../../../context/auth-context'
import Txt from '../../../components/text'
import SafeView from '../../../components/safe-view'
import { Colors } from '@heat-check/shared'
import tw from '../../../tw'
import Button from '../../../components/button'

const Profile = () => {
  const { user } = useUserStore()
  const { authUser, signOut } = useAuth()

  const provider = authUser?.provider
    ? authUser.provider.charAt(0).toUpperCase() + authUser.provider.slice(1)
    : '—'

  const Row = ({ label, value }: { label: string; value: string }) => (
    <View
      style={tw`flex-row justify-between items-center py-4 border-b border-grayBorder`}
    >
      <Txt twcn="text-xs uppercase tracking-wider text-grayText">{label}</Txt>
      <Txt twcn="text-base font-medium">{value}</Txt>
    </View>
  )

  return (
    <SafeView twcnContentView="gap-6">
      <View style={tw`items-center mt-4`}>
        <Txt twcn="text-2xl">{user?.username || '—'}</Txt>
        <Txt twcn="text-base text-grayText mt-1">{user?.email || '—'}</Txt>
      </View>

      <View>
        <Row
          label="Username"
          value={user?.username || '—'}
        />
        <Row
          label="Email"
          value={user?.email || '—'}
        />
        <Row
          label="Sign-in method"
          value={provider}
        />
      </View>

      <Button
        onPress={signOut}
        style={({ pressed }) => [
          tw`py-4 rounded-xl items-center justify-center mt-2`,
          { backgroundColor: Colors.primary, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Txt twcn="text-white font-semibold text-base">Sign Out</Txt>
      </Button>
    </SafeView>
  )
}

export default Profile
