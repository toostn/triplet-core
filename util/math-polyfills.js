Math.sinh = Math.sinh || function(x) {
  var y = Math.exp(x);
  return (y - 1 / y) / 2;
};

Math.cosh = Math.cosh || function(x) {
  var y = Math.exp(x);
  return (y + 1 / y) / 2;
};

Math.atanh = Math.atanh || function(x) { return Math.log((1+x)/(1-x)) / 2; };
