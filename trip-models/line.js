function Line(data) {
  this.number = undefined;
  this.colorFg = undefined;
  this.colorBg = undefined;

  if (data !== null && data !== undefined) {
    this.number = data.number;
    this.colorFg = data.colorFg;
    this.colorBg = data.colorBg;
  }
}

Line.prototype.equals = function(line) {
  return (line === this) || (line.number === this.number);
};

module.exports = Line;
