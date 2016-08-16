var CONSTRUCTORS = {
  GeoPoint: require('../trip-models/geopoint.js'),
  Station: require('../trip-models/station.js'),
  Location: require('../trip-models/location.js'),
  Carrier: require('../trip-models/carrier.js'),
  LegStop: require('../trip-models/leg-stop.js'),
  Leg: require('../trip-models/leg.js'),
  Line: require('../trip-models/line.js'),
  Trip: require('../trip-models/trip.js')
}

module.exports = function (key, value) {
  return (value !== null && value !== undefined && typeof value === 'object' &&
  '_tplType' in value &&
  value._tplType in CONSTRUCTORS)
    ? new CONSTRUCTORS[value._tplType](value)
    : value
}
