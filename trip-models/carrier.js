var Line = require('./line.js')

function Carrier (data) {
  this.name = null
  this.heading = null
  this.line = null
  this.type = null
  this.flags = null
  this.canceled = false

  if (data !== null && data !== undefined) {
    this.name = data.name
    this.heading = data.heading
    this.line = (data.line instanceof Line) ? data.line : new Line(data.line)
    this.type = data.type
    this.flags = data.flags
    this.canceled = data.canceled
  }
}

Carrier.prototype.equals = function (carrier) {
  return (carrier === this) ||
  ((carrier.type === this.type) &&
  (carrier.name === this.name) &&
  (carrier.heading === this.heading) &&
  this.line.equals(carrier.line))
}

Carrier.prototype.toJSON = function () {
  return {
    _tplType: 'Carrier',
    name: this.name,
    heading: this.heading,
    line: (this.line instanceof Line) ? this.line.toJSON() : null,
    type: this.type,
    flags: this.flags,
    canceled: this.canceled
  }
}

Carrier.Types = {
  unknown: 0,
  walk: 1,
  bus: 2,
  tram: 3,
  metro: 4,
  train: 5,
  commuterTrain: 6,
  boat: 7,
  taxi: 8,
  bike: 9
}

module.exports = Carrier
