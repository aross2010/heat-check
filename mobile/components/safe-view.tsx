import { ScrollView, View, ViewProps } from 'react-native'
import { ReactNode, forwardRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import tw from '../tw'
import {
  KeyboardAvoidingView,
  KeyboardAwareScrollView,
} from 'react-native-keyboard-controller'

type SafeViewProps = {
  keyboardAvoiding?: boolean
  bottomOffset?: number
  extraKeyboardSpace?: number
  children: ReactNode
  hasTabBar?: boolean
  twcnContentView?: string
  hasHeader?: boolean
  scroll?: boolean
  keyboardVerticalOffset?: number
  keyboardShouldPersistTaps?: 'never' | 'always' | 'handled'
  ignoreInset?: boolean
  scrollEnabled?: boolean
  onContentSizeChange?: (width: number, height: number) => void
} & ViewProps

const SafeView = forwardRef<ScrollView, SafeViewProps>(
  (
    {
      keyboardAvoiding,
      bottomOffset = 150,
      extraKeyboardSpace = 0,
      children,
      hasTabBar = false,
      twcnContentView,
      hasHeader = true,
      scroll = true,
      keyboardVerticalOffset = 115,
      keyboardShouldPersistTaps = 'handled',
      ignoreInset = false,
      scrollEnabled = true,
      onContentSizeChange,
      ...rest
    },
    ref,
  ) => {
    const insets = useSafeAreaInsets()

    const paddingClasses = `px-4 ${!hasTabBar ? 'pb-12' : 'pb-4'} ${!hasHeader ? `pt-[${insets.top}px]` : 'pt-2'}`

    if (keyboardAvoiding && scroll) {
      return (
        <KeyboardAwareScrollView
          contentInsetAdjustmentBehavior={ignoreInset ? 'never' : 'automatic'}
          keyboardShouldPersistTaps="handled"
          style={tw`flex-1 `}
          contentContainerStyle={tw`${ignoreInset ? 'mt-40' : ''} ${paddingClasses} ${twcnContentView ?? ''}`}
          bottomOffset={bottomOffset}
          extraKeyboardSpace={extraKeyboardSpace}
        >
          {children}
        </KeyboardAwareScrollView>
      )
    }

    if (keyboardAvoiding && !scroll) {
      return (
        <View style={tw`flex-1 `}>
          <KeyboardAvoidingView
            behavior="padding"
            style={tw`flex-1   ${paddingClasses} pb-0 ${!hasTabBar ? 'mb-16' : 'mb-4'} ${twcnContentView ?? ''}`}
            keyboardVerticalOffset={keyboardVerticalOffset}
          >
            {children}
          </KeyboardAvoidingView>
        </View>
      )
    }

    if (scroll) {
      return (
        <ScrollView
          {...rest}
          ref={ref}
          onContentSizeChange={onContentSizeChange}
          style={tw` flex-1`}
          contentContainerStyle={tw`${paddingClasses} ${twcnContentView ?? ''}`}
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustContentInsets={true}
          scrollEnabled={scrollEnabled}
        >
          {children}
        </ScrollView>
      )
    }

    return (
      <View
        style={tw`flex-1  ${paddingClasses} ${twcnContentView ?? ''}`}
        {...rest}
      >
        {children}
      </View>
    )
  },
)

export default SafeView
