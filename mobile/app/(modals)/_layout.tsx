import { router, Stack, useNavigation } from 'expo-router'
import Button from '../../components/button'
import tw from '../../tw'
import { View } from 'react-native'
import SFIcon from '../../components/sf-icon'
import { Colors } from '@heat-check/shared'

export default function ModalLayout() {
  return (
    <View style={tw`flex-1 bg-background dark:bg-dark-background`}>
      <Stack
        screenOptions={{
          headerShown: true,
          headerTransparent: true,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          headerLeft: () => (
            <Button
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityLabel="close modal"
              twcn="w-9 flex-row items-center justify-center h-full"
            >
              <SFIcon
                name="xmark"
                size={26}
                color={Colors.text}
              />
            </Button>
          ),
        }}
      >
        <Stack.Screen name="session" />
        <Stack.Screen
          name="session-form"
          options={{
            title: 'New Session',
          }}
        />
        <Stack.Screen
          name="live"
          options={{
            presentation: 'fullScreenModal',
            headerShown: false,
          }}
        />
      </Stack>
    </View>
  )
}
