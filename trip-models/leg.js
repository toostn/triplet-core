var LegStop = require('./leg-stop.js')
var Carrier = require('./carrier.js')

function Leg (data) {
  this.from = null
  this.to = null
  this.carrier = null
  this.messages = null

  if (data !== null && data !== undefined) {
    this.from = (data.from instanceof LegStop)
      ? data.from
      : new LegStop(data.from)
    this.to = (data.to instanceof LegStop)
      ? data.to
      : new LegStop(data.to)
    this.carrier = (data.carrier instanceof Carrier)
      ? data.carrier
      : new Carrier(data.carrier)
    this.messages = data.messages
  }
}

Leg.prototype.equals = function (leg) {
  return (leg === this) ||
  (this.carrier.equals(leg.carrier) &&
  this.from.equals(leg.from) &&
  this.to.equals(leg.to))
}

Leg.prototype.toJSON = function () {
  return {
    _tplType: 'Leg',
    from: (this.from instanceof LegStop) ? this.from.toJSON() : null,
    to: (this.to instanceof LegStop) ? this.to.toJSON() : null,
    carrier: (this.carrier instanceof Carrier) ? this.carrier.toJSON() : null,
    messages: this.messages
  }
}

module.exports = Leg
