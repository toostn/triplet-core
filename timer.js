var MicroEvent = requre('microevent');

function Timer(interval) {
  this.interval = interval;
  this.running = false;
  this._timeout = null;
  return this;
}

module.exports = Timer;

MicroEvent.mixin(Timer);

Timer.prototype.set = function set(interval) {
  if (this.running) this.stop();
  this.interval = interval;
  return this;
};

Timer.prototype.start = function start() {
  if (this.running) return;
  this._timeout = setTimeout(this.interval, this._trigger.bind(this));
  this.running = true;
  return this;
};

Timer.prototype.stop = function stop() {
  if (!this.running) return;
  clearTimeout(this._timeout);
  this._timeout = null;
  this.running = false;
  return this;
};

Timer.prototype._trigger = function _trigger() {
  this.trigger('alarm');
  this.running = false;
};
