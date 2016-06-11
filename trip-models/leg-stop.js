var GeoPoint = require('./geopoint.js')
var deserialize = require('../util/deserialize.js')

function LegStop (data) {
  this.point = null
  this.track = null
  this.plannedDate = null
  this.realTimeDate = null
  this.messages = null

  if (data !== null && data !== undefined) {
    this.point = (data.point instanceof GeoPoint)
      ? data.point
      : deserialize(data.point)
    this.track = data.track
    this.plannedDate = data.plannedDate
    this.realTimeDate = data.realTimeDate
    this.messages = data.messages
  }
}

Object.defineProperty(LegStop.prototype, 'date', {
  get: function date () {
    return this.realTimeDate || this.plannedDate
  }
})

// NOTE: Track is intentionally ignored when comparing equality
LegStop.prototype.equals = function (legStop) {
  return (legStop === this) ||
  ((legStop.plannedDate.getTime() === this.plannedDate.getTime()) &&
  this.point.equals(legStop.point))
}

LegStop.prototype.toJSON = function toJSON () {
  return {
    _tplType: 'LegStop',
    point: (this.point instanceof GeoPoint) ? this.point.toJSON() : null,
    track: this.track,
    plannedDate: this.plannedDate,
    realTimeDate: this.realTimeDate,
    messages: this.messages
  }
}

module.exports = LegStop
