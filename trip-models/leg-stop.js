function LegStop(data) {
  this.point = undefined;
  this.track = undefined;
  this.plannedDate = undefined;
  this.realTimeDate = undefined;
  this.messages = undefined;

  if (data !== null && data !== undefined) {
    this.point = data.point;
    this.track = data.track;
    this.plannedDate = data.plannedDate;
    this.realTimeDate = data.realTimeDate;
    this.messages = data.messages;
  }
}

Object.defineProperty(LegStop.prototype, 'date', {
  get: function date() {
    return this.realTimeDate || this.plannedDate;
  }
});

// NOTE: Track is intentionally ignored when comparing equality
LegStop.prototype.equals = function(legStop) {
  return (legStop === this) ||
    ((legStop.plannedDate.getTime() === this.plannedDate.getTime()) &&
    this.point.equals(legStop.point));
};

module.exports = LegStop;
