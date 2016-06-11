require('./math-polyfills.js')
var Location = require('../trip-models/location.js')

var DEG_TO_RAD = Math.PI / 180.0
var RAD_TO_DEG = 180.0 / Math.PI

exports.fromWGS84 = function (location) {
  var falseEasting = 500e3
  var falseNorthing = 10000e3

  var zone = Math.floor((location.longitude + 180) / 6) + 1 // longitudinal zone
  var λ0 = ((zone - 1) * 6 - 180 + 3) * DEG_TO_RAD // longitude of central meridian

  // ---- handle Norway/Svalbard exceptions
  // grid zones are 8° tall; 0°N is offset 10 into latitude bands array
  var mgrsLatBands = 'CDEFGHJKLMNPQRSTUVWXX'
  var latBand = mgrsLatBands.charAt(Math.floor(location.latitude / 8 + 10))
  // adjust zone & central meridian for Norway
  if (zone === 31 && latBand === 'V' && location.longitude >= 3) {
    zone++
    λ0 += (6) * DEG_TO_RAD
  }
  // adjust zone & central meridian for Svalbard
  if (zone === 32 && latBand === 'X' && location.longitude < 9) {
    zone--
    λ0 -= (6) * DEG_TO_RAD
  }
  if (zone === 32 && latBand === 'X' && location.longitude >= 9) {
    zone++
    λ0 += (6) * DEG_TO_RAD
  }
  if (zone === 34 && latBand === 'X' && location.longitude < 21) {
    zone--
    λ0 -= (6) * DEG_TO_RAD
  }
  if (zone === 34 && latBand === 'X' && location.longitude >= 21) {
    zone++
    λ0 += (6) * DEG_TO_RAD
  }
  if (zone === 36 && latBand === 'X' && location.longitude < 33) {
    zone--
    λ0 -= (6) * DEG_TO_RAD
  }
  if (zone === 36 && latBand === 'X' && location.longitude >= 33) {
    zone++
    λ0 += (6) * DEG_TO_RAD
  }

  var φ = location.latitude * DEG_TO_RAD
  var λ = location.longitude * DEG_TO_RAD - λ0

  var a = 6378137
  var f = 1 / 298.257223563
  var k0 = 0.9996 // UTM scale on the central meridian

  var e = Math.sqrt(f * (2 - f)) // eccentricity
  var n = f / (2 - f) // 3rd flattening
  var n2 = n * n
  var n3 = n * n2
  var n4 = n * n3
  var n5 = n * n4
  var n6 = n * n5

  var cosλ = Math.cos(λ)
  var sinλ = Math.sin(λ)
  var τ = Math.tan(φ)
  var σ = Math.sinh(e * Math.atanh(e * τ / Math.sqrt(1 + τ * τ)))
  var τʹ = τ * Math.sqrt(1 + σ * σ) - σ * Math.sqrt(1 + τ * τ)
  var ξʹ = Math.atan2(τʹ, cosλ)
  var ηʹ = Math.asinh(sinλ / Math.sqrt(τʹ * τʹ + cosλ * cosλ))
  var A = a / (1 + n) * (1 + 1 / 4 * n2 + 1 / 64 * n4 + 1 / 256 * n6)

  var α = [ 0, // note α is one-based array (6th order Krüger expressions)
    1 / 2 * n - 2 / 3 * n2 + 5 / 16 * n3 + 41 / 180 * n4 - 127 / 288 * n5 + 7891 / 37800 * n6,
    13 / 48 * n2 - 3 / 5 * n3 + 557 / 1440 * n4 + 281 / 630 * n5 - 1983433 / 1935360 * n6,
    61 / 240 * n3 - 103 / 140 * n4 + 15061 / 26880 * n5 + 167603 / 181440 * n6,
    49561 / 161280 * n4 - 179 / 168 * n5 + 6601661 / 7257600 * n6,
    34729 / 80640 * n5 - 3418889 / 1995840 * n6,
    212378941 / 319334400 * n6 ]

  var ξ = ξʹ

  for (var j = 1; j <= 6; j++) {
    ξ += α[j] * Math.sin(2 * j * ξʹ) * Math.cosh(2 * j * ηʹ)
  }

  var η = ηʹ

  for (var k = 1; k <= 6; k++) {
    η += α[k] * Math.cos(2 * k * ξʹ) * Math.sinh(2 * k * ηʹ)
  }

  var x = k0 * A * η
  var y = k0 * A * ξ

  // ---- convergence: Karney 2011 Eq 23, 24

  var pʹ = 1

  for (var l = 1; l <= 6; l++) {
    pʹ += 2 * l * α[l] * Math.cos(2 * l * ξʹ) * Math.cosh(2 * l * ηʹ)
  }

  var qʹ = 0

  for (var m = 1; m <= 6; m++) {
    qʹ += 2 * m * α[m] * Math.sin(2 * m * ξʹ) * Math.sinh(2 * m * ηʹ)
  }

  // shift x/y to false origins
  x = x + falseEasting // make x relative to false easting
  if (y < 0) {
    // make y in southern hemisphere relative to false northing
    y = y + falseNorthing
  }

  // round to reasonable precision
  x = Number(x.toFixed(6)) // nm precision
  y = Number(y.toFixed(6)) // nm precision

  return {x: x, y: y}
}

exports.toWGS84 = function (utmCoords, zone) {
  var h = utmCoords.y >= 0 ? 'N' : 'S' // hemisphere
  var z = zone
  var x = utmCoords.x
  var y = utmCoords.y

  if (isNaN(z) || isNaN(x) || isNaN(y)) {
    throw new Error('Invalid coordinate')
  }

  var falseEasting = 500e3
  var falseNorthing = 10000e3
  var a = 6378137
  var f = 1 / 298.257223563
  var k0 = 0.9996 // UTM scale on the central meridian

  x = x - falseEasting
  y = h === 'S' ? y - falseNorthing : y

  // ---- from Karney 2011 Eq 15-22, 36:

  var e = Math.sqrt(f * (2 - f)) // eccentricity
  var n = f / (2 - f) // 3rd flattening
  var n2 = n * n
  var n3 = n * n2
  var n4 = n * n3
  var n5 = n * n4
  var n6 = n * n5
  var A = a / (1 + n) * (1 + 1 / 4 * n2 + 1 / 64 * n4 + 1 / 256 * n6)
  var η = x / (k0 * A)
  var ξ = y / (k0 * A)

  var β = [ 0, // note β is one-based array (6th order Krüger expressions)
    1 / 2 * n - 2 / 3 * n2 + 37 / 96 * n3 - 1 / 360 * n4 - 81 / 512 * n5 + 96199 / 604800 * n6,
    1 / 48 * n2 + 1 / 15 * n3 - 437 / 1440 * n4 + 46 / 105 * n5 - 1118711 / 3870720 * n6,
    17 / 480 * n3 - 37 / 840 * n4 - 209 / 4480 * n5 + 5569 / 90720 * n6,
    4397 / 161280 * n4 - 11 / 504 * n5 - 830251 / 7257600 * n6,
    4583 / 161280 * n5 - 108847 / 3991680 * n6,
    20648693 / 638668800 * n6 ]

  var ξʹ = ξ
  for (var j = 1; j <= 6; j++) {
    ξʹ -= β[j] * Math.sin(2 * j * ξ) * Math.cosh(2 * j * η)
  }

  var ηʹ = η

  for (var k = 1; k <= 6; k++) {
    ηʹ -= β[k] * Math.cos(2 * k * ξ) * Math.sinh(2 * k * η)
  }

  var sinhηʹ = Math.sinh(ηʹ)
  var sinξʹ = Math.sin(ξʹ)
  var cosξʹ = Math.cos(ξʹ)
  var τʹ = sinξʹ / Math.sqrt(sinhηʹ * sinhηʹ + cosξʹ * cosξʹ)
  var τi = τʹ
  var δτi

  do {
    var σi = Math.sinh(e * Math.atanh(e * τi / Math.sqrt(1 + τi * τi)))
    var τiʹ = τi * Math.sqrt(1 + σi * σi) - σi * Math.sqrt(1 + τi * τi)
    δτi = (τʹ - τiʹ) / Math.sqrt(1 + τiʹ * τiʹ) *
      (1 + (1 - e * e) * τi * τi) / ((1 - e * e) * Math.sqrt(1 + τi * τi))
    τi += δτi
  } while (Math.abs(δτi) > 1e-12)

  var τ = τi
  var φ = Math.atan(τ)
  var λ = Math.atan2(sinhηʹ, cosξʹ)
  var p = 1

  for (var l = 1; l <= 6; l++) {
    p -= 2 * l * β[l] * Math.cos(2 * l * ξ) * Math.cosh(2 * l * η)
  }

  var q = 0

  for (var m = 1; m <= 6; m++) {
    q += 2 * m * β[m] * Math.sin(2 * m * ξ) * Math.sinh(2 * m * η)
  }

  var λ0 = ((z - 1) * 6 - 180 + 3) * DEG_TO_RAD
  λ += λ0
  var lat = Number((φ * RAD_TO_DEG).toFixed(11))
  var lon = Number((λ * RAD_TO_DEG).toFixed(11))

  return new Location({
    latitude: lat,
    longitude: lon
  })
}
