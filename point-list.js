// A generic list if GeoPoints that can be serialized and saved in localStorage
var Storage = require('./util/local-storage');
var geoPointDeserialize = require('./util/geopoint-deserialize');

function PointList(identifier, maxLength) {
  this._storageName = 'pl-' + identifier;
  this.maxLength = maxLength;
  this._points = loadList(this._storageName);
}

module.exports = PointList;

Object.defineProperty(PointList.prototype, 'points', {
  get: function() {
    return this._points;
  },
  set: function(points) {
    var maxLength = this.maxLength;
    if (maxLength && points.length > maxLength) {
      points = points.slice(0, maxLength);
    }
    this._points = points;
    _saveList(this._storageName, points);
  }
});

PointList.prototype.addPoint = function addPoint(point, exclusive) {
  var points = this.points;
  if (exclusive) {
    points = points.filter(function(oldPoint) {
      return !point.equals(oldPoint);
    });
  }
  points.splice(0, 0, point);
  this.points = points;
};

PointList.prototype.deletePoint = function deletePoint(point) {
  var index = this.points.indexOf(point);
  if (index < 0) { return; }
  this.points.splice(index, 1);
  this.points = this.points;
};

function loadList(identifier) {
  var json = Storage.get(identifier) || [];
  return json.map(function(jsonStation) {
    return geoPointDeserialize(jsonStation);
  });
}

function _saveList(identifier, list) {
  var json = list.map(function(point) {
    return point.toJSON();
  });
  Storage.set(identifier, json);
}
