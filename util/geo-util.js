var DEG_TO_RAD = Math.PI / 180

exports.distance = function distance (point1, point2) {
  if (point1 === null || point1 === undefined ||
    point2 === null || point2 === undefined) return 0

  var R = 6371000
  var lat1 = point1.latitude
  var lng1 = point1.longitude
  var lat2 = point2.latitude
  var lng2 = point2.longitude

  var dLat = (lat2 - lat1) * DEG_TO_RAD
  var dLng = (lng2 - lng1) * DEG_TO_RAD
  lat1 = lat1 * DEG_TO_RAD
  lat2 = lat2 * DEG_TO_RAD

  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) *
    Math.cos(lat1) * Math.cos(lat2)
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

exports.areaContainsLocation = function (poly, location) {
  var p = {coordinates: [location.longitude, location.latitude]}
  var coords = (poly.type === 'Polygon') ? [ poly.coordinates ] : poly.coordinates

  var insideBox = false

  for (var i = 0, l = coords.length; i < l; i++) {
    if (pointInBoundingBox(p, boundingBoxAroundPolyCoords(coords[i]))) {
      insideBox = true
    }
  }

  if (!insideBox) return false

  var insidePoly = false

  for (var j = 0, m = coords.length; j < m; j++) {
    if (pnpoly(p.coordinates[1], p.coordinates[0], coords[j])) {
      insidePoly = true
    }
  }

  return insidePoly
}

// From maxogden/goejson-js-utils
function boundingBoxAroundPolyCoords (coords) {
  var xAll = []
  var yAll = []

  for (var i = 0; i < coords[0].length; i++) {
    xAll.push(coords[0][i][1])
    yAll.push(coords[0][i][0])
  }

  xAll = xAll.sort(function (a, b) { return a - b })
  yAll = yAll.sort(function (a, b) { return a - b })

  return [ [xAll[0], yAll[0]], [xAll[xAll.length - 1], yAll[yAll.length - 1]] ]
}

function pnpoly (x, y, coords) {
  var vert = [ [0, 0] ]

  for (var i = 0, l = coords.length; i < l; i++) {
    for (var j = 0, m = coords[i].length; j < m; j++) {
      vert.push(coords[i][j])
    }

    vert.push(coords[i][0])
    vert.push([0, 0])
  }

  var inside = false

  for (var k = 0, n = vert.length - 1; k < vert.length; n = k++) {
    if (((vert[k][0] > y) !== (vert[n][0] > y)) &&
      (x < (vert[n][1] - vert[k][1]) *
      (y - vert[k][0]) / (vert[n][0] - vert[k][0]) + vert[k][1])) {
      inside = !inside
    }
  }

  return inside
}

function pointInBoundingBox (point, bounds) {
  return !(point.coordinates[1] < bounds[0][0] ||
  point.coordinates[1] > bounds[1][0] ||
  point.coordinates[0] < bounds[0][1] ||
  point.coordinates[0] > bounds[1][1])
}
