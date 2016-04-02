var Storage = require('./local-storage.js');

function ClientStorage(client) {
  this.prefix = client.shortName;
}

module.exports = ClientStorage;

ClientStorage.prototype.get = function get(key) {
  return Storage.get(this.prefix + ucFirst(key));
};

ClientStorage.prototype.set = function set(key, value) {
  Storage.set(this.prefix + ucFirst(key), value);
};

ClientStorage.prototype.remove = function remove(key) {
  Storage.remove(this.prefix + ucFirst(key));
};

function ucFirst(string) {
  return string[0].toUpperCase() + string.substr(1);
}
