var MicroEvent = require('microevent')
var GeoUtil = require('./util/geo-util.js')

var STATES = {
  stopped: 0,
  unavailable: 1,
  acquiring: 2,
  started: 3,
  denied: 4
}

var ACCURATE_MAX = 100
var LOCATION_MAX_AGE = 10000

var LocationService = function LocationService (provider) {
  this.provider = provider
  this._location = undefined
  this._state = STATES.stopped
  this.hasAccurateLocation = false
}

module.exports = LocationService

MicroEvent.mixin(LocationService)
LocationService.States = STATES

Object.defineProperty(LocationService.prototype, 'location', {
  get: function location () {
    return this._location
  },
  set: function (location) {
    var oldLocation = this._location
    this._location = location

    if (!oldLocation || !oldLocation.equals(location)) {
      this.trigger('change:location', location, oldLocation)
    }

    this.hasAccurateLocation = (location && location.accuracy <= ACCURATE_MAX)

    if (location) {
      this.state = STATES.started
    }
  }
})

Object.defineProperty(LocationService.prototype, 'state', {
  get: function state () {
    return this._state
  },
  set: function (state) {
    var oldState = this._state
    this._state = state

    if (oldState !== state) {
      this.trigger('change:state', state)
    }
  }
})

LocationService.prototype.start = function start () {
  this.state = STATES.acquiring
  this.provider.start(
    this._onLocation.bind(this),
    this._onError.bind(this)
  )
}

LocationService.prototype.pause = function pause () {
  this.provider.stop()
  this._location = undefined
  this._state = STATES.stopped
}

LocationService.prototype._onLocation = function _onLocation (location) {
  if (this._shouldSetLocation(location)) {
    this.location = location
  }
}

LocationService.prototype._onError = function _onError (error) {
  this.state = (error.code === 1) ? STATES.denied : STATES.unavailable
}

LocationService.prototype._shouldSetLocation = function _shouldSetLocation (loc) {
  return (loc.timestamp >= Date.now() - LOCATION_MAX_AGE &&
  (!this.location || (loc.accuracy <= this.location.accuracy ||
  GeoUtil.distance(this.location, loc) > loc.accuracy)))
}
