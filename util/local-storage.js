var storage = window.localStorage || {};

exports.get = function get(key) {
  var value = storage.getItem(key);
  if (value !== null && value !== undefined &&
      (value.charAt(0) === '[' || value.charAt(0) === '{')) {
    return JSON.parse(value);
  }
  return value;
};

exports.set = function set(key, value) {
  if (value === null || value === undefined) {
    return storage.removeItem(key);
  }
  var type = typeof value;
  if (type !== 'string' && type !== 'number') {
    value = JSON.stringify(value);
  }
  storage.setItem(key, value);
};

exports.remove = function remove(key) {
  storage.removeItem(key);
};
