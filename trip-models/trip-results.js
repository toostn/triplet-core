function TripResults(data) {
  this.trips = undefined;
  this.errors = undefined;
  this.lastSuggestion = undefined;
  this.lastUpdated = undefined;

  if (data !== null && data !== undefined) {
    this.trips = data.trips;
    this.errors = data.errors;
    this.lastSuggestion = data.lastSuggestion;
    this.lastUpdated = data.lastUpdated;
  }
}

module.exports = TripResults;
