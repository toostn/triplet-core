var GeoUtil = require('./util/geo-util.js');

var OVERRIDE_MAX_DISTANCE = 1000;
var LOCK_RELEASE_MARGIN = 100;
var FROM_LOCKS = {
  none: 0,
  nearby: 1,
  manual: 2
};

function FromStationSync(nearbyStations, overrides, tripsSearch) {
  this.overrides = overrides;
  this.nearbyStations = nearbyStations;
  this.tripsSearch = tripsSearch;
  this.fromLock = FROM_LOCKS.none;
  this.fromlockDistance = 0;
  if (nearbyStations) {
    nearbyStations.bind('change:stations', this.nearbyChanged.bind(this));
  }
  if (tripsSearch) {
    tripsSearch.bind('change:to', this.fromChanged.bind(this));
  }
}

module.exports = FromStationSync;

FromStationSync.prototype.nearbyChanged = function nearbyChanged(stations) {
  if (stations && stations.length > 0 && this.shouldChangeNearby()) {
    this.tripsSearch.from = (this.overrides) ?
      this.overrides.get(stations[0]) :
      stations[0];
  }
};

FromStationSync.prototype.shouldChangeNearby = function shouldSetNearby() {
  if (!this.tripsSearch.from ||
      this.fromLock === FROM_LOCKS.none) { return true; }
  if (this.fromLock === FROM_LOCKS.manual) { return false; }
  return (
    GeoUtil.distance(
      this.nearbyStations.lastSearchLocation,
      this.tripsSearch.from.location
    ) > this.fromlockDistance + LOCK_RELEASE_MARGIN
  );
};

FromStationSync.prototype.fromChanged = function fromChanged(station) {
  var nearbyStations = this.nearbyStations.stations;
  if (!(station && nearbyStations && nearbyStations[0])) { return; }
  var closestStation = nearbyStations[0];
  if (!closestStation.equals(station)) {
    var location = this.nearbyStations.lastSearchLocation;
    var distance = GeoUtil.distance(location, station.location);
    var isNearby = this.nearbyStations.isAmongNearby(station);
    if (isNearby || distance <= OVERRIDE_MAX_DISTANCE) {
      this.fromLock = FROM_LOCKS.nearby;
      this.fromlockDistance = distance;
      if (this.overrides) {
        this.overrides.set(closestStation, station);
      }
    } else {
      this.fromLock = FROM_LOCKS.manual;
    }
  } else {
    this.fromLock = FROM_LOCKS.none;
    if (this.overrides) {
      this.overrides.set(closestStation, undefined);
    }
  }
};
