var MicroEvent = require('microevent')

function StationSearch (apiClient) {
  this.apiClient = apiClient
  this._results = undefined
  this._queryString = ''
  this.searching = false
  this.resetOnSearch = true
}

module.exports = StationSearch

MicroEvent.mixin(StationSearch)

Object.defineProperty(StationSearch.prototype, 'queryString', {
  get: function get () {
    return this._queryString
  },
  set: function (queryString) {
    var _this = this
    this._queryString = queryString
    if (this.resetOnSearch) {
      this.results = []
    }
    if (queryString && queryString.length > 1) {
      this.searching = true
      this.apiClient
        .getStations({queryString: queryString})
        .then(function (query) {
          if (query.queryString === _this._queryString) {
            _this.results = query.results
            _this.searching = false
          }
        })
    }
  }
})

Object.defineProperty(StationSearch.prototype, 'results', {
  get: function get () {
    return this._results
  },
  set: function set (results) {
    this._results = results
    this.trigger('change:results', results)
  }
})
