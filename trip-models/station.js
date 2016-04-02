var GeoPoint = require('./geopoint');

function Station(data) {
  GeoPoint.prototype.constructor.call(this, data);

  this.id = undefined;
  this.area = undefined;
  this.clientId = undefined;
  this.type = 'Station';

  if (data !== null && data !== undefined) {
    this.id = data.id;
    this.area = data.area;
    this.clientId = data.clientId;
  }
}

Station.prototype = new GeoPoint();
Station.prototype.constructor = Station;

Station.prototype.toJSON = function() {
  var json = GeoPoint.prototype.toJSON.call(this);
  json.id = this.id;
  json.area = this.area;
  json.clientId = this.clientId;
  return json;
};

Station.prototype.equals = function(station) {
  return (station === this) ||
    ((station !== undefined) && (station !== null) &&
    (station.id === this.id) &&
    (station.clientId === this.clientId));
};

module.exports = Station;
