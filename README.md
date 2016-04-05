# Triplet Core

This repo contains the open source core parts of the Triplet travel planner app.

The intention is to soon document this library in order to allow people to more easily create applications based on public transport data.

Another intention with releasing this as open source is to allow collaboration on the Triplet clients. The clients are plugins that allow the Triplet Core library to connect to a multitide of travel planner backends.

Currently there are four clients available

- [triplet-client-vt](https://github.com/toostn/triplet-client-vt) (Västtrafik, SE)
- [triplet-client-skt](https://github.com/toostn/triplet-client-skt) (Skånetrafiken, SE) (Currently unavailable)
- [triplet-client-sl](https://github.com/toostn/triplet-client-sl) (Storstockholms Lokaltrafik, SE)
- [triplet-client-ruter](https://github.com/toostn/triplet-client-no) (Ruter, NO)

## Status

The code of the core and clients have been running stable in the Triplet app for some time now, however this modularized version is yet not working completely. A working version will soon be released.

## Documentation

Basically, for now there is none. The core and clients have just been separated from the main Triplet app and may not be working when combined using npm.

This code *should* set up a basic structure of components and performs a trip search from your current location to Järntorget. As the location changes and time passes, the trip results will automatically update.
This will only work within the Västtrafik area, currently the logic that automatically selects client based on location is part of the Triplet app. It will be released as part of triplet-core once it has been untangled from its Angular roots.

```
var vtClientFactory = require('triplet-client-vt');
var TripsSearch = require('triplet-core/trips-search');
var NavigatorLocationProvider = require('triplet-core/navigator-location-provider'); // currently not in repo :(
var LocationService = require('triplet-core/location-service');
var NearbyStations = require('triplet-core/nearby-stations');
var StationSearch = require('triplet-core/station-search');

var httpClient = fetch || angular.$http || window.myCustomPromiseBasedHTTPClient;
var client = vtClientFactory('secretAPIKet', httpClient);
var locationService = new LocationService(new NavigatorLocationProvider());
var nearbyStations = new NearbyStations(client, locationService);
var stationSearch = new StationSearch(client);
var tripsSearch = new TripsSearch(client, nearbyStations);

locationService.start();
tripsSearch.bind('change:results', function(results) {
  console.log(results);
});

stationSearch.queryString = 'Järntorget';
// wait for results (change:results event is currently missing in stationSearch)
tripsSearch.to = stationSearch.results[0];
```


## License
The MIT License (MIT)

Copyright (c) 2016 Torsten Freyhall

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
