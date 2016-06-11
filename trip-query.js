function TripQuery (from, to, date, quickMode) {
  this.from = from
  this.to = to
  this.date = date
  this.results = null
  this.error = null
  this.quickMode = quickMode
}

module.exports = TripQuery
