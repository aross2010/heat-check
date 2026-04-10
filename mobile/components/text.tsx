import { Text, TextProps, StyleSheet, TextStyle } from 'react-native'
import { ReactNode } from 'react'
import tw from '../tw'

type TxtProps = {
  children: ReactNode
  twcn?: string
} & TextProps

const fontFamilyFor = (
  weight: TextStyle['fontWeight'] | undefined,
  italic: boolean,
): string => {
  const w = weight == null ? '400' : String(weight)

  if (italic) {
    if (w === '700' || w === 'bold') return 'AlbertSans_700Bold_Italic'
    return 'AlbertSans_400Regular_Italic'
  }

  switch (w) {
    case '100':
    case '200':
    case '300':
    case 'light':
      return 'AlbertSans_300Light'
    case '500':
    case 'medium':
      return 'AlbertSans_500Medium'
    case '600':
    case 'semibold':
      return 'AlbertSans_600SemiBold'
    case '700':
    case '800':
    case '900':
    case 'bold':
      return 'AlbertSans_700Bold'
    default:
      return 'AlbertSans_400Regular'
  }
}

const Txt = ({ children, twcn, style, ...props }: TxtProps) => {
  const merged = (StyleSheet.flatten([
    tw.style('', twcn ?? ''),
    style,
  ]) ?? {}) as TextStyle

  const { fontWeight, fontStyle, ...rest } = merged
  const fontFamily = fontFamilyFor(fontWeight, fontStyle === 'italic')

  return (
    <Text
      {...props}
      allowFontScaling={false}
      style={[{ fontFamily }, rest]}
    >
      {children}
    </Text>
  )
}

export default Txt
