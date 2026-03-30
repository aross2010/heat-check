import { useTensorflowModel } from 'react-native-fast-tflite'
import { useEffect } from 'react'
import { View, Text } from 'react-native'

export default function App() {
  const model = useTensorflowModel(require('./model/best_float32.tflite'))

  useEffect(() => {
    if (model.state === 'loaded') {
      console.log('Model loaded successfully')
      console.log('Inputs:', model.model.inputs)
      console.log('Outputs:', model.model.outputs)
    }
    if (model.state === 'error') {
      console.log('Model error:', model.error)
    }
  }, [model.state])

  return (
    <View>
      <Text>Model state: {model.state}</Text>
    </View>
  )
}
