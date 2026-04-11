import { Colors } from '@heat-check/shared'

export const percentageToColor = (percentage: number) => {
  if (percentage >= 65) return Colors.green
  if (percentage >= 40) return Colors.yellow
  return Colors.red
}
