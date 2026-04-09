import { View } from 'react-native'
import { usePathname } from 'expo-router'
import { Colors } from '@heat-check/shared'
import tw from '../../tw'
import { NativeTabs } from 'expo-router/unstable-native-tabs'

const TabsLayout = () => {
  const liquidGlassTabs = (
    <NativeTabs
      labelStyle={{ selected: { color: Colors.primary } }}
      iconColor={Colors.primary}
    >
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="house.fill"
          md="home"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon
          sf="person.crop.circle.fill"
          md="settings"
        />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  )

  return (
    <View style={tw`flex-1 bg-background dark:bg-dark-background`}>
      {liquidGlassTabs}
    </View>
  )
}

export default TabsLayout
