function TripQuery(from, to, date, quickMode) {
  this.from = from;
  this.to = to;
  this.date = date;
  this.results = undefined;
  this.error = undefined;
  this.quickMode = quickMode;
}

module.exports = TripQuery;
