var Storage = require('./util/local-storage')
var geopointDeserialize = require('./util/geopoint-deserialize')

function PointOverrides (identifier) {
  this._storageName = 'or-' + identifier
  this._overrides = Storage.get(this._storageName) || {}
}

module.exports = PointOverrides

PointOverrides.prototype.get = function (station) {
  var override = this._overrides[station.id]

  if (override !== undefined) {
    return geopointDeserialize(override)
  }

  return station
}

PointOverrides.prototype.set = function (station, override) {
  if (station == null || station.id === undefined) return

  if (override !== undefined && override.id === station.id) {
    override = undefined
  }

  if (override === undefined) {
    delete this._overrides[station.id]
  } else {
    this._overrides[station.id] = override
  }

  Storage.set(this._storageName, this._overrides)
}
