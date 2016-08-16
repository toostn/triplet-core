var MicroEvent = require('microevent')
var GeoUtil = require('./util/geo-util.js')

function DistanceLocationFilter (locationService, distance) {
  this.distance = distance
  this.lastLocation = undefined

  locationService.bind(
    'change:location',
    this._onLocation.bind(this)
  )
}

MicroEvent.mixin(DistanceLocationFilter)

module.exports = DistanceLocationFilter

DistanceLocationFilter.prototype._onLocation = function (location) {
  if (this.lastLocation &&
      GeoUtil.distance(this.lastLocation, location) < this.distance) { return }

  this.lastLocation = location
  this.trigger('change:location', location)
}
