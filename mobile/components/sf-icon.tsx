import { SFSymbol, SymbolView } from 'expo-symbols'

import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

type SFIconProps = {
  name: SFSymbol
  size?: number
  color?: string
}

const SFIcon = ({ name, size, color }: SFIconProps) => {
  return (
    <SymbolView
      name={name}
      tintColor={color}
      style={{ width: size, height: size }}
    />
  )
}

export default SFIcon

const styles = StyleSheet.create({})
