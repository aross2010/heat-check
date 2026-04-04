import { Pressable, PressableProps } from 'react-native'
import React, { ReactNode } from 'react'
import Txt from './text'
import tw from '../tw'
import { useUserStore } from '../stores/user-store'

type ButtonProps = {
  children?: ReactNode
  text?: string
  twcnText?: string
  twcn?: string
  loading?: boolean
  loadingText?: string
} & PressableProps

const Button = ({
  children,
  text,
  twcnText,
  twcn,
  loading,
  loadingText = 'Loading...',
  disabled,
  onPress,
  ...props
}: ButtonProps) => {
  const isDisabled = disabled || loading

  const handlePress = (e: any) => {
    if (!isDisabled) {
      onPress?.(e)
    }
  }

  if (text) {
    return (
      <Pressable
        style={tw`active:opacity-70 ${isDisabled ? 'opacity-50' : ''} ${twcn ?? ''}`}
        disabled={isDisabled}
        onPress={handlePress}
        {...props}
      >
        <Txt twcn={twcnText}>{loading ? loadingText : text}</Txt>
        {children}
      </Pressable>
    )
  }

  return (
    <Pressable
      style={tw`active:opacity-70 ${isDisabled ? 'opacity-50' : ''} ${twcn ?? ''}`}
      disabled={isDisabled}
      onPress={handlePress}
      {...props}
    >
      {children}
    </Pressable>
  )
}

export default Button
