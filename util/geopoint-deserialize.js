var GeoPoint = require('../trip-models/geopoint');
var Station = require('../trip-models/station');
var Location = require('../trip-models/location');

module.exports = function deSerialize(data) {
  if (data === null || data === undefined) { return undefined; }
  if (data.location) {
    data.location = new Location(data.location);
  }
  if (data.type === 'GeoPoint') { return new GeoPoint(data); }
  if (data.type === 'Station') { return new Station(data); }
  return undefined;
};
