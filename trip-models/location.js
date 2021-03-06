function Location (data) {
  this.latitude = null
  this.longitude = null
  this.timestamp = null
  this.accuracy = null

  if (data !== null && data !== undefined) {
    this.latitude = data.latitude
    this.longitude = data.longitude
    this.timestamp = data.timestamp
    this.accuracy = data.accuracy
  }
}

Location.prototype.toJSON = function () {
  return {
    _tplType: 'Location',
    latitude: this.latitude,
    longitude: this.longitude,
    timestamp: this.timestamp,
    accuracy: this.accuracy
  }
}

Location.prototype.equals = function (location) {
  return (location === this) ||
  ((location.latitude === this.latitude) &&
  (location.longitude === this.longitude))
}

module.exports = Location
