function GeoPoint(data) {
  this.location = undefined;
  this.name = undefined;
  this.area = undefined;
  this.id = undefined;
  this.type = 'GeoPoint';

  if (data !== null && data !== undefined) {
    this.location = data.location;
    this.name = data.name;
    this.area = data.area;
    this.id = data.id;
  }
}

GeoPoint.prototype.toJSON = function () {
  return {
    location: this.location.toJSON(),
    name: this.name,
    type: this.type,
    area: this.area,
    id: this.id
  };
};

GeoPoint.prototype.equals = function(point) {
  return (point === this) ||
    ((point !== null && point !== undefined) &&
     (point.type === this.type) &&
    (point.id === this.id) &&
    (point.name === this.name) &&
    (point.are === this.area) &&
    point.location.equals(this.location));
};

module.exports = GeoPoint;
