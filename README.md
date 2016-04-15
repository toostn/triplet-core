# Triplet Core

This repo contains the open source core parts of the Triplet travel planner app.

The intention is to soon document this library in order to allow people to more easily create applications based on public transport data.

Another intention with releasing this as open source is to allow collaboration on the Triplet clients. The clients are plugins that allow the Triplet Core library to connect to a multitide of travel planner backends.

Currently there are four clients available

- [triplet-client-vt](https://github.com/toostn/triplet-client-vt) (Västtrafik, SE)
- [triplet-client-skt](https://github.com/toostn/triplet-client-skt) (Skånetrafiken, SE)
- [triplet-client-sl](https://github.com/toostn/triplet-client-sl) (Storstockholms Lokaltrafik, SE)
- [triplet-client-ruter](https://github.com/toostn/triplet-client-ruter) (Ruter, NO)

## Status

The code of the core and clients have been running stable in the Triplet app for some time now, so should you figure out how to use it, you should be safe using it.

## Documentation

The code snippet below is all there is for now.

This code sets up a basic structure of components and performs a trip search from your current location to Järntorget. As the location changes and time passes, the trip results will automatically update.
This will only work within the Västtrafik area, currently the logic that automatically selects client based on location is part of the Triplet app. It will be released as part of triplet-core once it has been untangled from its Angular roots.

```
// The client plug-in for Västtrafik
var vtClientFactory = require('triplet-client-vt');

// The trips search engine
var TripsSearch = require('triplet-core/trips-search');

// Current location provider plugin, this one is using html5 geolocation
var NavigatorLocationProvider = require('triplet-core/navigator-location-provider');

// Service that generates Location objects from a location provider and also
// filters unwanted location data
var LocationService = require('triplet-core/location-service');

// Service that uses the stream of Locations to fetch the current nearby stations
var NearbyStations = require('triplet-core/nearby-stations');

// Service that accepts a query string and returns a list of Stations / GeoPoints that
// match that query
var StationSearch = require('triplet-core/station-search');

// Triplet can use any http client that works with the fetch API, i.e. accepts a config object
// and returns a Promise.
var httpClient = fetch || angular.$http || window.myCustomPromiseBasedHTTPClient;

// Join the pieces
var client = vtClientFactory('secretAPIKet', httpClient);
var locationService = new LocationService(new NavigatorLocationProvider());
var nearbyStations = new NearbyStations(client, locationService);
var stationSearch = new StationSearch(client);
var tripsSearch = new TripsSearch(client, nearbyStations);

// Start the location service
locationService.start();

// Whenever there are changes in station search results, set first result
// as trip destination.
stationSearch.bind('change:results', function(results) {
  tripsSearch.to = results[0];
});

// Whenever the trip ends change, or trip data is updated, log the new suggestions
// to console.
tripsSearch.bind('change:results', function(results) {
  console.log(results);
});

stationSearch.queryString = 'Järntorget';

```

## Future improvements
- Clients should expose config and parser functions for each request type, so instead of injecting a http client in constructor and managing the http conneciton, the client is only responsible for creating http request config and parsing the response.
- Rewrite everything using RxJS. The core is mostly a set of streams already, and using RxJS would reduce the amount of code and probably improve the code patterns.


## License
The MIT License (MIT)

Copyright (c) 2016 Torsten Freyhall

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
