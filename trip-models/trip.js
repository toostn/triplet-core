var Carrier = require('./carrier.js')

function Trip (data) {
  this.legs = null
  this.messages = null

  if (data) {
    this.legs = data.legs
    this.messages = data.messages
  }
}

Object.defineProperty(Trip.prototype, 'departureDate', {
  get: function () {
    return this.legs[0].from.date
  }
})

Object.defineProperty(Trip.prototype, 'nonWalkDepartureDate', {
  get: function () {
    for (var i = 0, l = this.legs.length; i < l; i++) {
      var leg = this.legs[i]

      if (this.legs[i].carrier.type !== Carrier.Types.walk) {
        return leg.from.date
      }
    }

    return this.legs[0].from.date
  }
})

Object.defineProperty(Trip.prototype, 'arrivalDate', {
  get: function () {
    return this.legs[this.legs.length - 1].to.date
  }
})

Object.defineProperty(Trip.prototype, 'duration', {
  get: function () {
    return this.arrivalDate.getTime() - this.departureDate.getTime()
  }
})

Object.defineProperty(Trip.prototype, 'waitingTime', {
  get: function () {
    if (this._waitingTime === undefined) {
      this._waitingTime = 0

      var legs = this.legs

      if (legs && legs.length > 1) {
        for (var i = 0, l = legs.length - 1; i < l; i++) {
          var leg = legs[i]
          var nextLeg = legs[i + 1]

          if ((i === 0 && leg.carrier.type === Carrier.Types.walk) ||
            (i === (l - 1) && nextLeg.carrier.type === Carrier.Types.walk)) {
            continue
          }

          this._waitingTime += nextLeg.from.date.getTime() - leg.to.date.getTime()
        }
      }
    }

    return this._waitingTime
  }
})

Trip.prototype.equals = function (trip) {
  if (trip === this) return true

  if (trip.legs.length !== this.legs.length) return false

  for (var i = 0, len = trip.legs.length; i < len; i++) {
    if (!trip.legs[i].equals(this.legs[i])) return false
  }

  return true
}

Trip.prototype.toJSON = function () {
  return {
    _tplType: 'Trip',
    legs: this.legs,
    messages: this.messages
  }
}

module.exports = Trip
