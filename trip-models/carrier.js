function Carrier(data) {
  this.name = undefined;
  this.heading = undefined;
  this.line = undefined;
  this.type = undefined;
  this.flags = undefined;
  this.canceled = false;

  if (data !== null && data !== undefined) {
    this.name = data.name;
    this.heading = data.heading;
    this.line = data.line;
    this.type = data.type;
    this.flags = data.flags;
    this.canceled = data.canceled;
  }
}

Carrier.prototype.equals = function(carrier) {
  return (carrier === this) ||
    ((carrier.type === this.type) &&
    (carrier.name === this.name) &&
    (carrier.heading === this.heading) &&
    this.line.equals(carrier.line));
};

Carrier.Types = {
  unknown: 0,
  walk: 1,
  bus: 2,
  tram: 3,
  metro: 4,
  train: 5,
  commuterTrain: 6,
  boat: 7,
  taxi: 8,
  bike: 9
};

module.exports = Carrier;
