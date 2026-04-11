export const formatTime = (time: number) => {
  const seconds = Math.floor(time / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  const secs = seconds % 60
  const mins = minutes % 60

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return `${mins}:${secs.toString().padStart(2, '0')}`
}
