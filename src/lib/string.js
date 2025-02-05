export default {
  /*
   * Detect if number are present in the name and generate the next
   * increment. If there is no number, we consider that a new name
   * must be written.
   */
  generateNextName (name, padding = 1) {
    var matches = name.match(/\d+$/)
    if (matches) {
      const number = matches[0]
      const rootName = name.substring(0, name.length - number.length)
      let numberInt = parseInt(number)
      if (numberInt === 1 && padding === 10) numberInt = 10
      else numberInt += padding
      return rootName + String(numberInt).padStart(number.length, '0')
    } else {
      return ''
    }
  },

  shortenText (text, maxLength) {
    let result = text || ''
    if (text !== undefined && text.length > maxLength) {
      result = text.slice(0, maxLength) + '...'
      result = result.replace(/\n/g, ' ')
    }

    return result
  }
}
