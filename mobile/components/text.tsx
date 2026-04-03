import { Text, TextProps } from 'react-native'
import { ReactNode } from 'react'
import tw from '../tw'

type TxtProps = {
  children: ReactNode
  twcn?: string
} & TextProps

const Txt = ({ children, twcn, ...props }: TxtProps) => {
  return (
    <Text
      {...props}
      allowFontScaling={false}
      style={tw.style('', twcn ?? '')}
    >
      {children}
    </Text>
  )
}

export default Txt
