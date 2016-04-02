function StationSearch(apiClient) {
  this.apiClient = apiClient;
  this.results = undefined;
  this._queryString = '';
  this.searching = false;
  this.resetOnSearch = true;
}

module.exports = StationSearch;

Object.defineProperty(StationSearch.prototype, 'queryString', {
  get: function get() {
    return this._queryString;
  },
  set: function (queryString) {
    var _this = this;
    this._queryString = queryString;
    if (this.resetOnSearch) {
      this.results = [];
    }
    if (queryString && queryString.length > 1) {
      this.searching = true;
      this.apiClient
        .getStations({queryString: queryString})
        .then(function(query)  {
          if (query.queryString === _this._queryString) {
            _this.results = query.results;
            _this.searching = false;
          }
      });
    }
  }
});
