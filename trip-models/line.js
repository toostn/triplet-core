function Line (data) {
  this.number = null
  this.colorFg = null
  this.colorBg = null

  if (data !== null && data !== undefined) {
    this.number = data.number
    this.colorFg = data.colorFg
    this.colorBg = data.colorBg
  }
}

Line.prototype.equals = function (line) {
  return (line === this) || (line.number === this.number)
}

Line.prototype.toJSON = function toJSON () {
  return {
    _tplType: 'Line',
    number: this.number,
    colorFg: this.colorFg,
    colorBg: this.colorBg
  }
}

module.exports = Line
