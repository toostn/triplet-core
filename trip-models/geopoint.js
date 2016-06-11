var Location = require('./location.js')

function GeoPoint (data) {
  this.location = null
  this.name = null
  this.area = null
  this.id = null
  this.type = 'GeoPoint'

  if (data !== null && data !== undefined) {
    this.location = (data.location instanceof Location)
      ? data.location
      : new Location(data.location)
    this.name = data.name
    this.area = data.area
    this.id = data.id
  }
}

GeoPoint.prototype.toJSON = function () {
  return {
    _tplType: 'GeoPoint',
    location: (this.location instanceof Location)
      ? this.location.toJSON()
      : null,
    name: this.name,
    type: this.type,
    area: this.area,
    id: this.id
  }
}

GeoPoint.prototype.equals = function (point) {
  return (point === this) ||
  ((point !== null && point !== undefined) &&
  (point.type === this.type) &&
  (point.id === this.id) &&
  (point.name === this.name) &&
  (point.are === this.area) &&
  point.location.equals(this.location))
}

module.exports = GeoPoint
