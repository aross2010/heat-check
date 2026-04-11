export const formatDate = (date: Date | string) => {
  let dateObj: Date

  if (typeof date === 'string') {
    const [year, month, day] = date.split('-').map(Number)
    dateObj = new Date(year, month - 1, day)
  } else {
    dateObj = date
  }

  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
