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
            fontWeight: 600,
          },
          headerLargeTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
    </Stack>
  )
}
