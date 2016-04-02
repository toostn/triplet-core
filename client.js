function Client(http, config) {
  this.http = http;
  this.config = config;
}

module.exports = Client;

Object.defineProperty(Client.prototype, 'shortName', {
  get: function() { return this.config.shortName; }
});

Object.defineProperty(Client.prototype, 'fullName', {
  get: function() { return this.config.fullName; }
});

Object.defineProperty(Client.prototype, 'area', {
  get: function() { return this.config.geojson; }
});

Object.defineProperty(Client.prototype, 'supports', {
  get: function() { return this.config.supports || {}; }
});

Client.prototype.getStations = function getStations(query) {
  return this._request('stations', query);
};

Client.prototype.getTrips = function getTrips(query) {
  return this._request('trips', query);
};

Client.prototype.getNearbyStations = function getNearbyStations(query) {
  return this._request('nearbyStations', query);
};

Client.prototype._request = function _request(endpoint, query) {
  var config = this.config;
  return this.http({
    method: 'GET',
    url: getUrl(config[endpoint], query),
    params: config.params[endpoint](query, config)
  }).then(function(res) {
    var errorParser = config.parsers[endpoint + 'Error'];
    query.error = errorParser ? errorParser(res.data) : null;
    query.results = query.error ? null : config.parsers[endpoint](res.data, query);
    return query;
  }, function(res) {
    query.error = serverErrorText(res);
    return query;
  });
};

function getUrl(url, query) {
  return (typeof url === 'function') ? url(query) : url;
}

function serverErrorText(res) {
  return (res.status === -1) ? 'No internet connection' : res.statusText;
}
