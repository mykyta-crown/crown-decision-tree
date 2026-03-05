export default function (
  number,
  style = 'decimal',
  unit,
  minimumIntegerDigits = 1,
  maximumFractionDigits = 2,
  isObject = false
) {
  const options = { minimumIntegerDigits, maximumFractionDigits }

  // Always use en-US format regardless of locale
  const formatedNumber = `${new Intl.NumberFormat('en-US', options).format(number)} ${style !== 'decimal' ? unit : ''}`

  if (isObject) {
    return {
      value: formatedNumber.split(' ')[0],
      currency: formatedNumber.split(' ')[1]
    }
  }

  return formatedNumber
}
