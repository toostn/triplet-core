var MicroEvent = require('microevent')
var LocalTime = require('./local-time.js')
var TripQuery = require('./trip-query.js')
var ResultFilters = require('./result-filters.js')
var GeoPoint = require('./trip-models/geopoint.js')

var STATES = {
  idle: 0,
  searching: 1,
  refreshing: 2,
  gettingLater: 3
}

var MIN_RESULTS = 5

var TripsSearch = function TripsSearch (client) {
  this.apiClient = client
  this._from = null
  this._to = null
  this._quickMode = false
  this._results = null
  this._error = null
  this.hasLaterDepartures = true
  this._queries = []
  this.refreshWithinInterval = 3600000
  this._state = STATES.idle
  this._shouldGetLaterDepartures = false
  this.resultFilters = [
    ResultFilters.cancelled,
    ResultFilters.departed,
    ResultFilters.missedConnections,
    ResultFilters.departureSort,
    ResultFilters.duplicates
  ]
}

module.exports = TripsSearch

MicroEvent.mixin(TripsSearch)

Object.defineProperty(TripsSearch.prototype, 'from', {
  get: function () {
    return this._from
  },
  set: function (from) {
    if (this._from && this._from.equals(from)) return
    this._from = from
    this.trigger('change:from', from)
    this.setTripDirty()
  }
})

Object.defineProperty(TripsSearch.prototype, 'to', {
  get: function () {
    return this._to
  },
  set: function (to) {
    if (this._to && this._to.equals(to)) return
    this._to = to
    this.trigger('change:to', to)
    this.setTripDirty()
  }
})

Object.defineProperty(TripsSearch.prototype, 'quickMode', {
  get: function () {
    return this._quickMode
  },
  set: function (quickMode) {
    if (this._quickMode === quickMode) return
    this._quickMode = quickMode
    this.trigger('change:quickMode', quickMode)
    this.setTripDirty()
  }
})

Object.defineProperty(TripsSearch.prototype, 'results', {
  get: function () {
    return this._results
  },
  set: function (results) {
    if (results === this._results) return
    this._results = results
    this.trigger('change:results', results)
  }
})

Object.defineProperty(TripsSearch.prototype, 'error', {
  get: function () {
    return this._error
  },
  set: function (error) {
    if (error === this._error) return
    this._error = error
    this.trigger('change:error', error)
  }
})

Object.defineProperty(TripsSearch.prototype, 'state', {
  get: function () {
    return this._state
  },
  set: function (state) {
    if (state === this._state) return
    var previousState = this._state
    this._state = state
    this.trigger('change:state', state, previousState)
  }
})

TripsSearch.prototype.setTripDirty = function () {
  var from = this.from
  var to = this.to
  if (from instanceof GeoPoint && to instanceof GeoPoint) {
    if (to.equals(from)) {
      this.to = null
    } else {
      return this.search()
    }
  }
  this.results = null
  this.error = null
  this.abort()
}

// Manage searching
TripsSearch.prototype.search = function () {
  var query = new TripQuery(this.from, this.to, null, this.quickMode)
  this.results = null
  this.error = null
  this.hasLaterDepartures = true
  this._queries = [query]
  this.state = STATES.searching
  this.apiClient
    .getTrips(query)
    .then(this._queryFinished.bind(this))
}

TripsSearch.prototype.abort = function () {
  this._queries = []
  this.state = STATES.idle
  this._shouldGetLaterDepartures = false
}

TripsSearch.prototype.retry = function () {
  this.setTripDirty()
}

TripsSearch.prototype.refresh = function () {
  if (this._queries.length === 0 || this.error) return
  var query = this._queries[0]
  query.date = null
  this.state = STATES.refreshing
  this.apiClient.getTrips(query).then(this._queryFinished.bind(this))
}

TripsSearch.prototype.getLaterDepartures = function () {
  if (!this.hasLaterDepartures ||
    (!this.results) ||
    (this.results.length === 0) ||
    (this.state === STATES.gettingLater) ||
    (!this.from || !this.to)) return
  if (this.state !== STATES.idle) {
    this._shouldGetLaterDepartures = true
    return
  } else {
    this._shouldGetLaterDepartures = false
  }
  var departureDate = getNextDepartureTime(this.results)
  var query = new TripQuery(this.from, this.to, departureDate, this.quickMode)
  this._queries.push(query)
  this.state = STATES.gettingLater
  this.apiClient.getTrips(query).then(this._queryFinished.bind(this))
}

TripsSearch.prototype._queryFinished = function (query) {
  var index = this._queries.indexOf(query)
  if (index === -1) return
  var finished = false
  var localDate = LocalTime.get()
  if (this.state === STATES.searching) {
    if (query.results && query.results.length > 0 && query.retryCount !== 1 &&
      query.results[query.results.length - 1].departureDate < localDate.getTime()) {
      // Search with current time if all trips are departed
      // Setting a date prevents clients from adding extra past search time.
      query.date = LocalTime.get()
      query.retryCount = 1
      this.apiClient.getTrips(query).then(this._queryFinished.bind(this))
    } else {
      finished = true
    }
  } else if (this.state === STATES.gettingLater) {
    finished = true
  } else {
    if (index < this._queries.length - 1) {
      var nextQuery = this._queries[index + 1]
      var nextDepartureDate = getNextDepartureTime(query.results)
      if (nextQuery.date.getTime() > localDate.getTime() + this.refreshWithinInterval) {
        finished = true
      } else {
        nextQuery.date = nextDepartureDate
        this.apiClient.getTrips(nextQuery).then(this._queryFinished.bind(this))
      }
    } else {
      finished = true
    }
  }
  if (finished) {
    this._mergeResults()
    this.state = STATES.idle
    if (this.results && this.results.length < MIN_RESULTS) {
      this._shouldGetLaterDepartures = true
    }
    if (this._shouldGetLaterDepartures) {
      this.getLaterDepartures()
    }
  }
}

TripsSearch.prototype._mergeResults = function () {
  var results = []
  for (var i = 0, l = this._queries.length; i < l; i++) {
    var query = this._queries[i]
    var queryResults = query.results || []
    if (i === 0 && query.error) {
      this.error = query.error
      this.results = null
      return
    }
    for (var j = 0, m = queryResults.length; j < m; j++) {
      results.push(queryResults[j])
    }
  }
  for (var k = 0, n = this.resultFilters.length; k < n; k++) {
    var filter = this.resultFilters[k]
    results = filter(results)
  }
  if (this.state === STATES.gettingLater) {
    this.hasLaterDepartures = this.results.length < results.length
  }
  this.results = results
}

TripsSearch.States = STATES

// Refreshing trips
function getNextDepartureTime (results) {
  var lastDepartureDate = results[results.length - 1].departureDate
  var departureDate = new Date(lastDepartureDate.getTime())
  departureDate.setMinutes(departureDate.getMinutes() + 1, 0, 0)
  return departureDate
}
