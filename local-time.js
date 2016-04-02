var Storage = require('./util/local-storage.js');

var STORAGE_KEY = 'localTimeDiff';
var ONE_MINUTE = 60000;
var _diff = parseInt(Storage.get(STORAGE_KEY) || 0);

function set(date) {
  var diff = Date.now() - date.getTime();
  _diff = (Math.abs(diff) > ONE_MINUTE) ? diff : 0;
  Storage.set(STORAGE_KEY, _diff);
}

function get() {
  return new Date(Date.now() - _diff);
}

module.exports = {
  set: set,
  get: get
};
