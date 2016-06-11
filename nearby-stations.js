var MicroEvent = require('microevent')
var GeoUtil = require('./util/geo-util')
var GeoPoint = require('./trip-models/geopoint.js')

var DEFAULTS = {
  updateMinDistance: 50
}

var STATES = {
  awaitingLocation: 0,
  requestingStations: 1,
  tracking: 2
}

var NearbyStations = function NearbyStations (apiClient, locationService) {
  this.apiClient = apiClient
  this.locationService = locationService
  this._stations = undefined
  this.currentGeoPoint = undefined
  this.lastSearchLocation = undefined
  this.updateMinDistance = DEFAULTS.updateMinDistance
  this.state = STATES.awaitingLocation

  if (!apiClient) {
    throw new Error('Failed to create NearbyStations: API client undefined')
  }

  locationService.bind(
    'change:location',
    this.onLocationChanged.bind(this),
    this
  )

  if (locationService.location) {
    this.onLocationChanged(locationService.location)
  }
}

module.exports = NearbyStations

MicroEvent.mixin(NearbyStations)
NearbyStations.States = STATES

Object.defineProperty(NearbyStations.prototype, 'stations', {
  get: function () {
    return this._stations
  },
  set: function (stations) {
    this._stations = stations
    this.trigger('change:stations', stations)
  }
})

NearbyStations.prototype.onLocationChanged = function onLocationChanged (location) {
  // Fetch new stations from client if needed,
  // otherwise just re-sort current stations
  if (this.shouldFetch(location) === true) {
    var _this = this
    this.lastSearchLocation = location

    if (this.state === STATES.awaitingLocation) {
      this.state = STATES.requestingStations
    }

    this.apiClient.getNearbyStations({
      location: location
    }).then(function (query) {
      _this.stations = query.results
        ? query.results.sort(_this._sortNearby.bind(_this))
        : []

      if (_this.state === STATES.requestingStations) {
        _this.state = STATES.tracking
      }
    })
  } else if (this.stations) {
    this.stations = this.stations.sort(this._sortNearby.bind(this))
    this.state = STATES.tracking
  }

  if (this.apiClient.supports.coordinateSearch) {
    this.currentGeoPoint = new GeoPoint({
      name: 'CURRENT_LOCATION',
      location: location
    })
  }
}

NearbyStations.prototype.isAmongNearby = function isAmongNearby (station) {
  if (!this.stations) return false
  for (var i = 0, l = this.stations.length; i < l; i++) {
    if (this.stations[i].equals(station)) {
      return true
    }
  }
  return false
}

NearbyStations.prototype.shouldFetch = function (location) {
  // Search if
  // * No previous location
  // * Moved more than configured distance away from current nearby station
  // * New location has better accuracy and isn't close to last location
  var distance = GeoUtil.distance(this.lastSearchLocation, location)
  return ((this.lastSearchLocation === undefined) ||
  (distance > this.updateMinDistance))
}

NearbyStations.prototype._sortNearby = function sortNearby (a, b) {
  var distA = GeoUtil.distance(this.locationService.location, a.location)
  var distB = GeoUtil.distance(this.locationService.location, b.location)
  return distA - distB
}
