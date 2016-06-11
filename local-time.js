var ONE_MINUTE = 60000
var _diff = 0

function set (date) {
  var diff = Date.now() - date.getTime()
  _diff = (Math.abs(diff) > ONE_MINUTE) ? diff : 0
}

function get () {
  return new Date(Date.now() - _diff)
}

module.exports = {
  set: set,
  get: get
}
