export function formatNumber(num: number): string {
  if (num < 10000) {
    console.log(num, typeof num)
    return num.toLocaleString('en-US')
  }

  if (num < 1000000) {
    return (num / 1000).toFixed(1) + 'K'
  }

  return (num / 1000000).toFixed(1) + 'M'
}
