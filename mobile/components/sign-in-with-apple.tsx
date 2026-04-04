import * as AppleAuthentication from 'expo-apple-authentication'
import { useAuth } from '../context/auth-context'

export function SignInWithApple({ disabled }: { disabled?: boolean }) {
  const { signInWithApple } = useAuth()

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={9999}
      style={{ width: '100%', height: 52, opacity: disabled ? 0.5 : 1 }}
      onPress={() => (disabled ? null : signInWithApple(false))}
    />
  )
}
