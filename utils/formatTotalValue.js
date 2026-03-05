export default function ({ additive, multiplicative }, quantity = 1, basePrice = 0) {
  // Helper function to format float numbers
  const formatFloat = (num) => {
    if (Number.isInteger(num)) return num.toString()
    return Number(num.toFixed(2)).toString()
  }

  const result = {
    text: '',
    value: {
      type: null,
      value: null
    },
    basePrice: basePrice,
    unitPrice: basePrice,
    totalPrice: basePrice * quantity
  }

  // Handle additive value
  if (additive !== null) {
    if (additive !== 0) {
      const formattedNum = formatFloat(additive)
      result.text += additive > 0 ? ' + ' + formattedNum : ' - ' + Math.abs(Number(formattedNum))
      result.value = {
        type: 'additive',
        value: Number(formattedNum)
      }

      result.unitPrice = basePrice + Number(formattedNum)
      result.totalPrice = result.unitPrice * quantity
    }
  }

  // Handle multiplicative value
  if (multiplicative !== null) {
    if (multiplicative !== 1) {
      const formattedNum = formatFloat(multiplicative)
      // if (multiplicative < 1) {
      //   // For values less than 1, use division
      //   const reciprocal = 1 / multiplicative;
      //   result.text += ' / ' + formatFloat(reciprocal);
      // } else {
      // For values greater than 1, use multiplication
      result.text += ' * ' + formattedNum
      // }
      result.value = {
        type: 'multiplicative',
        value: Number(formattedNum)
      }
      result.unitPrice = basePrice * Number(formattedNum)
      result.totalPrice = result.unitPrice * quantity
    }
  }

  return result
}
