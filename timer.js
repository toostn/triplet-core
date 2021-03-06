var MicroEvent = require('microevent')

function Timer (interval) {
  this.interval = interval
  this.running = false
  this._timeout = null
  return this
}

module.exports = Timer

MicroEvent.mixin(Timer)

Timer.prototype.set = function (interval) {
  if (this.running) this.stop()
  this.interval = interval
  return this
}

Timer.prototype.start = function () {
  if (this.running) return
  this._timeout = setTimeout(this._trigger.bind(this), this.interval)
  this.running = true
  return this
}

Timer.prototype.stop = function () {
  if (!this.running) return
  clearTimeout(this._timeout)
  this._timeout = null
  this.running = false
  return this
}

Timer.prototype._trigger = function () {
  this.trigger('alarm')
  this.running = false
}
