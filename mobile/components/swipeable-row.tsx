import React, { useEffect, useRef } from 'react'
import { Animated, PanResponder, View } from 'react-native'
import tw from '../tw'
import Button from './button'
import SFIcon from './sf-icon'
import { Colors } from '@heat-check/shared'

const DELETE_WIDTH = 80

type Props = {
  children: React.ReactNode
  onDelete: () => void
}

const SwipeableRow = ({ children, onDelete }: Props) => {
  const translateX = useRef(new Animated.Value(0)).current
  const currentX = useRef(0)
  const gestureStartX = useRef(0)

  useEffect(() => {
    const id = translateX.addListener(({ value }) => {
      currentX.current = value
    })
    return () => translateX.removeListener(id)
  }, [translateX])

  const snapTo = (toValue: number) => {
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start()
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8,
      onPanResponderGrant: () => {
        translateX.stopAnimation()
        gestureStartX.current = currentX.current
      },
      onPanResponderMove: (_, { dx }) => {
        const next = Math.min(
          0,
          Math.max(-DELETE_WIDTH, gestureStartX.current + dx),
        )
        translateX.setValue(next)
      },
      onPanResponderRelease: (_, { dx, vx }) => {
        const endVal = Math.min(
          0,
          Math.max(-DELETE_WIDTH, gestureStartX.current + dx),
        )
        if (endVal < -(DELETE_WIDTH / 2) || vx < -0.5) {
          snapTo(-DELETE_WIDTH)
        } else {
          snapTo(0)
        }
      },
      onPanResponderTerminate: () => {
        snapTo(0)
      },
    }),
  ).current

  const handleDelete = () => {
    snapTo(0)
    onDelete()
  }

  return (
    <View style={tw`overflow-hidden`}>
      <View
        style={[
          tw`absolute right-0 top-0 bottom-0 bg-red-600 items-center justify-center`,
          { width: DELETE_WIDTH },
        ]}
      >
        <Button
          onPress={handleDelete}
          twcn="flex-1 w-full items-center justify-center"
        >
          <SFIcon
            name="trash.fill"
            color={Colors.red}
            size={20}
          />
        </Button>
      </View>
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  )
}

export default SwipeableRow
