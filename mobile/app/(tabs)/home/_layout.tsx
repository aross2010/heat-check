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
