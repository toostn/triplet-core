var MicroEvent = require('microevent');
var LocalTime = require('./local-time.js');
var TripQuery = require('./trip-query.js');
var ResultFilters = require('./result-filters.js');
var ClientStorage = require('./util/client-storage.js');
var geoPointDeserialize = require('./util/geopoint-deserialize.js');
var GeoUtil = require('./util/geo-util.js');
var GeoPoint = require('./trip-models/geopoint.js');

var FROM_LOCKS = {
  none: 0,
  nearby: 1,
  manual: 2
};

var STATES = {
  idle: 0,
  searching: 1,
  refreshing: 2,
  gettingLater: 3,
  paused: 4
};

var EXPIRE_INTERVAL = 7200000;
var OVERRIDE_MAX_DISTANCE = 1000;
var LOCK_RELEASE_MARGIN = 100;
var MIN_RESULTS = 5;
var KEY_LAST_FROM = 'lastFrom';
var KEY_LAST_TO_DATE = 'lastTimestamp';
var KEY_LAST_TO = 'lastDestination';
var KEY_QUICK_MODE = 'quick';

var TripsSearch = function TripsSearch(client, nearbyStations, overrides) {
  this.apiClient = client;
  this.nearbyStations = nearbyStations;
  this.overrides = overrides;
  this.storage = new ClientStorage(client);

  this._from = geoPointDeserialize(this.storage.get(KEY_LAST_FROM));
  this._to = this._loadLastTo();
  this._quickMode = (this.storage.get(KEY_QUICK_MODE) === "true");
  this._results = null;
  this._error = null;
  this.hasLaterDepartures = true;
  this.queries = [];

  this._state = STATES.idle;
  this.shouldGetLaterDepartures = false;

  this.resultFilters = [
    ResultFilters.cancelled,
    ResultFilters.departed,
    ResultFilters.missedConnections,
    ResultFilters.departureSort,
    ResultFilters.duplicates
  ];

  this.fromLock = FROM_LOCKS.none;
  this.fromlockDistance = 0;

  this.refreshInterval = 30000;
  this.refreshWithinInterval = 3600000;
  this.refreshTimeout = undefined;

  if (this.nearbyStations) {
    this.nearbyStations.bind(
      'change:stations',
      this._onNearbyStationsChanged.bind(this)
    );
  }

  this.setTripDirty();
};

module.exports = TripsSearch;

MicroEvent.mixin(TripsSearch);

Object.defineProperty(TripsSearch.prototype, 'from', {
  get: function () {
    return this._from;
  },
  set: function(from) {
    if (this._from && this._from.equals(from)) { return; }
    this._from = from;
    this.storage.set(KEY_LAST_FROM, from ? from.toJSON() : null);
    this._setOverridesAndLock(from);
    this.setTripDirty();
  }
});

Object.defineProperty(TripsSearch.prototype, 'to', {
  get: function () {
    return this._to;
  },
  set: function(to) {
    if (this._to && this._to.equals(to)) { return; }
    this._to = to;
    this._saveLastTo(to);
    this.setTripDirty();
  }
});

Object.defineProperty(TripsSearch.prototype, 'quickMode', {
  get: function () {
    return this._quickMode;
  },
  set: function(quickMode) {
    if (this._quickMode === quickMode) { return; }
    this._quickMode = quickMode;
    this.storage.set(KEY_QUICK_MODE, quickMode);
    this.setTripDirty();
  }
});

Object.defineProperty(TripsSearch.prototype, 'results', {
  get: function() {
    return this._results;
  },
  set: function(results) {
    var lastResults = this._results;
    this._results = results;
    if (results !== lastResults) {
      this.trigger('change:results', results);
    }
  }
});

Object.defineProperty(TripsSearch.prototype, 'error', {
  get: function() {
    return this._error;
  },
  set: function(error) {
    var lastError = this._error;
    this._error = error;
    if (error !== lastError) {
      this.trigger('change:error', error);
    }
  }
});

Object.defineProperty(TripsSearch.prototype, 'state', {
  get: function() {
    return this._state;
  },
  set: function (state) {
    var lastState = this._state;
    if (state !== lastState) {
      this._state = state;
      this.trigger('change:state', state, lastState);
    }
  }
});

TripsSearch.prototype.setTripDirty = function setTripDirty() {
  var from = this.from;
  var to = this.to;
  if (from instanceof GeoPoint && to instanceof GeoPoint) {
    if (to.equals(from)) {
      this.to = null;
    } else {
      return this.search();
    }
  }
  this.results = null;
  this.error = null;
  this.abort();
};

// Manage nearby stations
var _onNearbyStationsChanged = function _onNearbyStationsChanged(stations) {
  if (stations &&
      stations.length > 0 &&
      this._shouldReplaceWithNearbyStation(stations[0])) {
    this.from = (this.overrides) ? this.overrides.get(stations[0]) : stations[0];
  }
};

TripsSearch.prototype._onNearbyStationsChanged =_onNearbyStationsChanged;

var _shouldReplaceWithNearbyStation = function _shouldReplaceWithNearbyStation() {
  if (!this.from || this.fromLock === FROM_LOCKS.none) { return true; }
  if (this.fromLock === FROM_LOCKS.manual) { return false; }
  var location = this.nearbyStations.lastSearchLocation;
  var distance = GeoUtil.distance(location, this.from.location);
  return (distance > this.fromlockDistance + LOCK_RELEASE_MARGIN);
};

TripsSearch.prototype._shouldReplaceWithNearbyStation = _shouldReplaceWithNearbyStation;

TripsSearch.prototype._setOverridesAndLock = function _setOverridesAndLock(station) {
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

// Manage searching
TripsSearch.prototype.abort = function abort() {
  this._clearRefreshTimeout();
  this.queries = [];
  this.state = STATES.idle;
};

TripsSearch.prototype.retry = function retry() {
  this.setTripDirty();
};

TripsSearch.prototype.resume = function resume() {
  this.state = STATES.idle;
  if (this._loadLastTo() !== null) {
    if (this.refreshAtTimestamp > Date.now()) {
      this._setRefreshTimeout(this.refreshAtTimestamp - Date.now());
    } else {
      this._refresh();
    }
  } else {
    this.to = null;
  }
};

TripsSearch.prototype.pause = function pause() {
  this._clearRefreshTimeout();
  this.state = STATES.paused;
};

TripsSearch.prototype.search = function search() {
  var query = new TripQuery(this.from, this.to, undefined, this.quickMode);
  this.results = null;
  this.error = null;
  this.hasLaterDepartures = true;
  this.queries = [query];
  this._clearRefreshTimeout();
  this.state = STATES.searching;
  this.apiClient
    .getTrips(query)
    .then(this._queryFinished.bind(this));
};

TripsSearch.prototype.getLaterDepartures = function getLaterDepartures() {
  if (!this.hasLaterDepartures ||
      (!this.results) ||
      (this.results.length === 0) ||
      (this.state === STATES.gettingLater) ||
      (!this.from || !this.to)) { return; }
  if (this.state !== STATES.idle) {
    this.shouldGetLaterDepartures = true;
    return;
  } else {
    this.shouldGetLaterDepartures = false;
  }
  var departureDate = getNextDepartureTime(this.results);
  var query = new TripQuery(this.from, this.to, departureDate, this.quickMode);
  this.queries.push(query);
  this.state = STATES.gettingLater;
  this.apiClient.getTrips(query).then(this._queryFinished.bind(this));
};

TripsSearch.prototype._queryFinished = function _queryFinished(query) {
  var index = this.queries.indexOf(query);
  if (index === -1 || this.state === STATES.paused) { return; }
  var finished = false;
  var localDate = LocalTime.get();
  if (this.state === STATES.searching) {
    if (query.results && query.results.length > 0 && query.retryCount !== 1 &&
        query.results[query.results.length - 1].departureDate < localDate.getTime()) {
      // Search with current time if all trips are departed
      // Setting a date prevents clients from adding extra past search time.
      query.date = LocalTime.get();
      query.retryCount = 1;
      this.apiClient.getTrips(query).then(this._queryFinished.bind(this));
    } else {
      finished = true;
    }
  } else if (this.state === STATES.gettingLater) {
    finished = true;
  } else {
    if (index < this.queries.length - 1) {
      var nextQuery = this.queries[index + 1];
      var nextDepartureDate = getNextDepartureTime(query.results);
      if (nextQuery.date.getTime() > localDate.getTime() + this.refreshWithinInterval) {
        finished = true;
      } else {
        nextQuery.date = nextDepartureDate;
        this.apiClient.getTrips(nextQuery).then(this._queryFinished.bind(this));
      }
    } else {
      finished = true;
    }
  }
  if (finished) {
    this._mergeResults();
    this.state = STATES.idle;
    if (this.results && this.results.length < MIN_RESULTS) {
      this.shouldGetLaterDepartures = true;
    }
    if (this.shouldGetLaterDepartures) {
      this.getLaterDepartures();
    } else {
      this._setRefreshTimeout();
    }
  }
};

TripsSearch.prototype._mergeResults = function _mergeResults() {
  var results = [];
  for (var i = 0, l = this.queries.length; i < l; i++) {
    var query = this.queries[i];
    var queryResults = query.results || [];
    if (i === 0 && query.error) {
      this.error = query.error;
      this.results = null;
      return;
    }
    for (var j = 0, m = queryResults.length; j < m; j++) {
      results.push(queryResults[j]);
    }
  }
  for (var k = 0, n = this.resultFilters.length; k < n; k++) {
    var filter = this.resultFilters[k];
    results = filter(results);
  }
  if (this.state === STATES.gettingLater) {
    this.hasLaterDepartures = this.results.length < results.length;
  }
  this.results = results;
};

TripsSearch.States = STATES;

// Refreshing trips
TripsSearch.prototype._setRefreshTimeout = function _setRefreshTimeout(interval) {
  if (this.refreshTimeout !== undefined) { return; }
  if (interval === undefined) {
    interval = this.refreshInterval;
  }
  this.refreshAtTimestamp = Date.now() + interval;
  this.refreshTimeout = setTimeout(this._refresh.bind(this), interval);
};

TripsSearch.prototype._clearRefreshTimeout = function _clearreshTimeout() {
  if (this.refreshTimeout === undefined) { return; }
  clearTimeout(this.refreshTimeout);
  this.refreshTimeout = undefined;
};

TripsSearch.prototype._refresh = function _refresh() {
  this.refreshTimeout = undefined;
  if (!this._shouldRefresh()) { return; }
  var query = this.queries[0];
  query.date = undefined;
  this.state = STATES.refreshing;
  this.apiClient.getTrips(query).then(this._queryFinished.bind(this));
};

TripsSearch.prototype._shouldRefresh = function _shouldRefresh() {
  return (this.queries.length !== 0 && !this.error);
};

TripsSearch.prototype._saveLastTo = function _saveLastTo(point) {
  this.storage.set(KEY_LAST_TO, point ? point.toJSON() : null);
  this.storage.set(KEY_LAST_TO_DATE, point ? Date.now() : null);
};

TripsSearch.prototype._loadLastTo = function _loadLastTo() {
  if (parseInt(this.storage.get(KEY_LAST_TO_DATE) || 0) + EXPIRE_INTERVAL > Date.now()) {
    return geoPointDeserialize(this.storage.get(KEY_LAST_TO));
  }
  return null;
};

function getNextDepartureTime(results) {
  var lastDepartureDate = results[results.length - 1].departureDate;
  var departureDate = new Date(lastDepartureDate.getTime());
  departureDate.setMinutes(departureDate.getMinutes() + 1, 0, 0);
  return departureDate;
}
