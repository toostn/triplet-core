var Location = require('./trip-models/location.js')

var NavigatorLocationProvider = function NavigatorLocationProvider () {
  this._watchId = undefined
}

module.exports = NavigatorLocationProvider

NavigatorLocationProvider.prototype.start = function start (onLocation, onError) {
  if (this._watchId !== undefined) return

  if (!navigator.geolocation) {
    return onError({code: 2})
  }

  this._watchId = navigator.geolocation.watchPosition(
    function (pos) {
      onLocation(locationFromPosition(pos))
    },
    onError,
    { enableHighAccuracy: true }
  )
}

NavigatorLocationProvider.prototype.stop = function stop () {
  if (this._watchId === undefined) return

  navigator.geolocation.clearWatch(this._watchId)
  this._watchId = undefined
}

function locationFromPosition (pos) {
  return new Location({
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    timestamp: pos.timestamp,
    accuracy: pos.coords.accuracy
  })
}
