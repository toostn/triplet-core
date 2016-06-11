var Location = require('../trip-models/location.js')
require('./math-polyfills.js')

// Projection constants
var degToRad = Math.PI / 180.0
var radToDeg = 180.0 / Math.PI
var axis = 6378137.0 // GRS 80.
var flattening = 1.0 / 298.257222101 // GRS 80.
var centralMeridian = 15.0 + 48.0 / 60.0 + 22.624306 / 3600.0
var scale = 1.00000561024
var lamdbaZero = centralMeridian * degToRad
var falseNorthing = -667.711
var falseEasting = 1500064.274
var e2 = flattening * (2.0 - flattening)
var n = flattening / (2.0 - flattening)
var aRoof = axis / (1.0 + n) * (1.0 + n * n / 4.0 + n * n * n * n / 64.0)
var A = e2
var B = (5.0 * e2 * e2 - e2 * e2 * e2) / 6.0
var C = (104.0 * e2 * e2 * e2 - 45.0 * e2 * e2 * e2 * e2) / 120.0
var D = (1237.0 * e2 * e2 * e2 * e2) / 1260.0
var beta1 = n / 2.0 - 2.0 * n * n / 3.0 + 5.0 * n * n * n / 16.0 + 41.0 * n * n * n * n / 180.0
var beta2 = 13.0 * n * n / 48.0 - 3.0 * n * n * n / 5.0 + 557.0 * n * n * n * n / 1440.0
var beta3 = 61.0 * n * n * n / 240.0 - 103.0 * n * n * n * n / 140.0
var beta4 = 49561.0 * n * n * n * n / 161280.0

exports.fromWGS84 = function fromWGS84 (location) {
  var rt90 = {x: 0, y: 0}

  var phi = location.latitude * degToRad
  var lambda = location.longitude * degToRad

  var phiStar = phi - Math.sin(phi) * Math.cos(phi) *
    (A + B * Math.pow(Math.sin(phi), 2) + C * Math.pow(Math.sin(phi), 4) +
    D * Math.pow(Math.sin(phi), 6))

  var deltaLambda = lambda - lamdbaZero
  var ziPrim = Math.atan(Math.tan(phiStar) / Math.cos(deltaLambda))
  var etaPrim = Math.atanh(Math.cos(phiStar) * Math.sin(deltaLambda))
  var x = scale * aRoof *
    (ziPrim + beta1 * Math.sin(2.0 * ziPrim) * Math.cosh(2.0 * etaPrim) +
    beta2 * Math.sin(4.0 * ziPrim) * Math.cosh(4.0 * etaPrim) +
    beta3 * Math.sin(6.0 * ziPrim) * Math.cosh(6.0 * etaPrim) +
    beta4 * Math.sin(8.0 * ziPrim) * Math.cosh(8.0 * etaPrim)) + falseNorthing

  var y = scale * aRoof *
    (etaPrim + beta1 * Math.cos(2.0 * ziPrim) * Math.sinh(2.0 * etaPrim) +
    beta2 * Math.cos(4.0 * ziPrim) * Math.sinh(4.0 * etaPrim) +
    beta3 * Math.cos(6.0 * ziPrim) * Math.sinh(6.0 * etaPrim) +
    beta4 * Math.cos(8.0 * ziPrim) * Math.sinh(8.0 * etaPrim)) + falseEasting

  rt90.x = Math.round(Math.round(x * 1000.0) / 1000.0)
  rt90.y = Math.round(Math.round(y * 1000.0) / 1000.0)

  return rt90
}

exports.toWGS84 = function toWGS84 (rt90Coord) {
  var x = rt90Coord.X
  var y = rt90Coord.Y

  var delta1 = n / 2.0 - 2.0 * n * n / 3.0 + 37.0 * n * n * n / 96.0 - n * n * n * n / 360.0
  var delta2 = n * n / 48.0 + n * n * n / 15.0 - 437.0 * n * n * n * n / 1440.0
  var delta3 = 17.0 * n * n * n / 480.0 - 37 * n * n * n * n / 840.0
  var delta4 = 4397.0 * n * n * n * n / 161280.0
  var Astar = e2 + e2 * e2 + e2 * e2 * e2 + e2 * e2 * e2 * e2
  var Bstar = -(7.0 * e2 * e2 + 17.0 * e2 * e2 * e2 + 30.0 * e2 * e2 * e2 * e2) / 6.0
  var Cstar = (224.0 * e2 * e2 * e2 + 889.0 * e2 * e2 * e2 * e2) / 120.0
  var Dstar = -(4279.0 * e2 * e2 * e2 * e2) / 1260.0
  var xi = (x - falseNorthing) / (scale * aRoof)
  var eta = (y - falseEasting) / (scale * aRoof)
  var ziPrim = xi -
    delta1 * Math.sin(2.0 * xi) * Math.cosh(2.0 * eta) -
    delta2 * Math.sin(4.0 * xi) * Math.cosh(4.0 * eta) -
    delta3 * Math.sin(6.0 * xi) * Math.cosh(6.0 * eta) -
    delta4 * Math.sin(8.0 * xi) * Math.cosh(8.0 * eta)
  var etaPrim = eta -
    delta1 * Math.cos(2.0 * xi) * Math.sinh(2.0 * eta) -
    delta2 * Math.cos(4.0 * xi) * Math.sinh(4.0 * eta) -
    delta3 * Math.cos(6.0 * xi) * Math.sinh(6.0 * eta) -
    delta4 * Math.cos(8.0 * xi) * Math.sinh(8.0 * eta)
  var phiStar = Math.asin(Math.sin(ziPrim) / Math.cosh(etaPrim))
  var deltaLambda = Math.atan(Math.sinh(etaPrim) / Math.cos(ziPrim))
  var lonRadian = lamdbaZero + deltaLambda
  var latRadian = phiStar + Math.sin(phiStar) * Math.cos(phiStar) *
    (Astar +
    Bstar * Math.pow(Math.sin(phiStar), 2) +
    Cstar * Math.pow(Math.sin(phiStar), 4) +
    Dstar * Math.pow(Math.sin(phiStar), 6))

  return new Location({
    latitude: latRadian * radToDeg,
    longitude: lonRadian * radToDeg
  })
}
