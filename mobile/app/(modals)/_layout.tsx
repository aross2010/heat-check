import { router, Stack, useNavigation } from 'expo-router'
import Button from '../../components/button'
import tw from '../../tw'
import { View } from 'react-native'
import SFIcon from '../../components/sf-icon'

export default function ModalLayout() {
  return (
    <View style={tw`flex-1 bg-background dark:bg-dark-background`}>
      <Stack
        screenOptions={{
          headerShown: true,
          headerTransparent: true,
          headerShadowVisible: false,
          headerLargeTitle: true,
          headerTitleStyle: {
            fontWeight: 600,
          },
          headerLargeTitleStyle: {
            fontWeight: '600',
          },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="session" />
        <Stack.Screen name="session-form" />
      </Stack>
    </View>
  )
}
