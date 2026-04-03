import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { ActivityIndicator } from 'react-native'
import tw from '../tw'
import Txt from './text'

type SpinnerProps = {
  size?: 'small' | 'large'
  color?: string
  twcn?: string
  fullScreen?: boolean
  text?: string
  loadingTab?: boolean
  overlay?: boolean
  transparent?: boolean
}

const Spinner = ({
  size = 'small',
  color,
  twcn,
  fullScreen = true,
  text,
  overlay = false,
}: SpinnerProps) => {
  const spinner = (
    <ActivityIndicator
      size={size}
      color={color}
      style={tw`bg-transparent ${twcn ?? ''}`}
      pointerEvents="none"
    />
  )

  if (fullScreen) {
    return (
      <View
        style={tw`${overlay ? 'absolute inset-0 justify-center items-center' : 'flex-1 flex-row justify-center items-center bg-light-background dark:bg-dark-background'}`}
      >
        {spinner}
        {text && (
          <Txt twcn="ml-2 text-sm text-light-grayText dark:text-dark-grayText">
            {text}
          </Txt>
        )}
      </View>
    )
  }

  return spinner
}

export default Spinner

const styles = StyleSheet.create({})
