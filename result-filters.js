var CarrierTypes = require('./trip-models/carrier.js').Types;
var LocalTime = require('./local-time.js');

exports.departureSort = function(results) {
  return results.sort(function(a, b) {
    var diff = a.departureDate - b.departureDate;
    return (diff !== 0) ? diff : a.arrivalDate - b.arrivalDate;
  });
};

exports.duplicates = function(results) {
  return results.filter(function(trip, index) {
    if (index === results.length - 1) { return true; }
    return !trip.equals(results[index + 1]);
  });
};

exports.cancelled = function(results) {
  return results.filter(function(trip) {
    for (var i = 0, l = trip.legs.length; i < l; i++) {
      if (trip.legs[i].cancelled) {
        return false;
      }
    }
    return true;
  });
};

exports.missedConnections = function(results) {
  return results.filter(function(trip) {
    var legs = trip.legs;
    for (var i = 0, l = legs.length - 1; i < l; i++)  {
      var leg = legs[i];
      var nextLeg = legs[i + 1];
      if (leg.carrier.type === CarrierTypes.walk ||
          nextLeg.carrier.type === CarrierTypes.walk) { return true; }
      return leg.to.date <= nextLeg.from.date;
    }
    return true;
  });
};

exports.departed = function(results) {
  var now = LocalTime.get();
  var minuteAgo = now.getTime() - 90000;
  return results.filter(function(trip) {
    return trip.nonWalkDepartureDate.getTime() > minuteAgo;
  });
};
