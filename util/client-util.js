/* globals escape */

exports.forceArray = function (obj) {
  if (obj instanceof Array) {
    return obj
  } else if (obj === null || obj === undefined) {
    return []
  }
  return [obj]
}

exports.dtString = function (number) {
  return ((number < 10) ? '0' : '') + number
}

exports.parseLocalDate = function (dateString, timeString) {
  if (!dateString || !timeString) return null
  var dateComponents = dateString.split('-')
  var timeComponents = timeString.split(':')
  return (dateComponents.length !== 3 || timeComponents.length < 2)
    ? null
    : new Date(
      parseInt(dateComponents[0]),
      parseInt(dateComponents[1] - 1),
      parseInt(dateComponents[2]),
      parseInt(timeComponents[0]),
      parseInt(timeComponents[1]),
      parseInt(timeComponents[2] || 0),
      0
    )
}

exports.fixEncodingIssues = function (string) {
  var decodedString
  try {
    decodedString = decodeURIComponent(escape(string))
  } catch (e) {
    decodedString = string
  }
  return decodedString
}
