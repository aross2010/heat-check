import { TextInput, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import tw from '../../tw'
import { BASE_URL, Colors, CreatedSession } from '@heat-check/shared'
import { useNavigation } from 'expo-router'
import { GlassView } from 'expo-glass-effect'
import Button from '../../components/button'
import { router } from 'expo-router'
import SFIcon from '../../components/sf-icon'
import { useAuth } from '../../context/auth-context'
import Spinner from '../../components/spinner'

const SessionForm = () => {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { fetchWithAuth } = useAuth()
  const navigation = useNavigation()

  const generateSession = async () => {
    // save session to DB, get ID
    // navigate to live session screen with that ID
    setIsLoading(true)
    try {
      const res = await fetchWithAuth(`${BASE_URL}/api/sessions`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          location,
          description,
        }),
      })
      const data = (await res.json()) as CreatedSession
      router.push(`/live?id=${data.id}`)
    } catch (error) {
      console.error('Error creating session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        return isLoading ? (
          <Spinner
            twcn="w-9"
            fullScreen={false}
          />
        ) : (
          <Button
            onPress={generateSession}
            twcn="w-9 flex-row items-center justify-center h-full"
          >
            <SFIcon
              name="checkmark"
              color={Colors.primary}
              size={28}
            />
          </Button>
        )
      },
    })
  }, [])

  return (
    <SafeView
      keyboardAvoiding
      twcnContentView="gap-5"
    >
      <Txt twcn="text-grayText text-center">
        For best results, place your device in landscape mode with a clear view
        of the hoop, centered horizontally.
      </Txt>

      <View>
        <Txt twcn="text-xs uppercase tracking-wider text-grayText mb-2">
          Name
        </Txt>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Morning shootaround"
          placeholderTextColor={Colors.grayText}
          style={[
            tw`text-base text-text border border-grayBorder rounded-xl px-4`,
            { height: 48, lineHeight: 20 },
          ]}
        />
      </View>

      <View>
        <Txt twcn="text-xs uppercase tracking-wider text-grayText mb-2">
          Location
        </Txt>
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="Backyard court"
          placeholderTextColor={Colors.grayText}
          style={[
            tw`text-base text-text border border-grayBorder rounded-xl px-4`,
            { height: 48, lineHeight: 20 },
          ]}
        />
      </View>

      <View>
        <Txt twcn="text-xs uppercase tracking-wider text-grayText mb-2">
          Description
        </Txt>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Notes about this session..."
          placeholderTextColor={Colors.grayText}
          multiline
          textAlignVertical="top"
          style={[
            tw`text-base text-text border border-grayBorder rounded-xl px-4 py-3 min-h-24`,
            { lineHeight: 20 },
          ]}
        />
      </View>
    </SafeView>
  )
}

export default SessionForm
