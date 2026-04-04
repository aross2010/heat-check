import { View, Image, Text } from 'react-native'
import tw from '../tw'
import Button from './button'
import Google from '../assets/google.png'

export default function SignInWithGoogle({
  onPress,
  disabled,
}: {
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <Button
      onPress={onPress}
      disabled={disabled}
      style={tw`w-full h-[52px] rounded-full justify-center bg-white border border-light-grayBorder `}
    >
      <View
        style={tw`flex-row justify-center flex-1 items-center gap-1.5 text-center`}
      >
        <Image
          source={Google}
          style={{
            width: 16,
            height: 16,
          }}
        />
        <Text style={tw`text-xl dark:text-white`}>Continue with Google </Text>
      </View>
    </Button>
  )
}
