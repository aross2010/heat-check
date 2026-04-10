import { Stack } from 'expo-router'

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Profile',
          headerLargeTitle: true,
          headerTransparent: true,
          headerTitleStyle: {
            fontFamily: 'AlbertSans_600SemiBold',
          },
          headerLargeTitleStyle: {
            fontFamily: 'AlbertSans_600SemiBold',
          },
        }}
      />
    </Stack>
  )
}
