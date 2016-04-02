function Leg(data) {
  this.from = undefined;
  this.to = undefined;
  this.carrier = undefined;
  this.messages = undefined;

  if (data !== null && data !== undefined) {
    this.from = data.from;
    this.to  = data.to;
    this.carrier = data.carrier;
    this.messages = data.messages;
  }
}

Leg.prototype.equals = function(leg) {
  return (leg === this) ||
    (this.carrier.equals(leg.carrier) &&
    this.from.equals(leg.from) &&
    this.to.equals(leg.to));
};

module.exports = Leg;
