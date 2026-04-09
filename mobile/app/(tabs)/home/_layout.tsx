import { Stack } from 'expo-router'

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Home',
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
