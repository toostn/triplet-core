var Location = require('../trip-models/location.js');
require('./math-polyfills.js');

// Projection constants
var deg_to_rad = Math.PI / 180.0;
var rad_to_deg = 180.0 / Math.PI;
var axis = 6378137.0; // GRS 80.
var flattening = 1.0 / 298.257222101; // GRS 80.
var central_meridian = 15.0 + 48.0/60.0 + 22.624306/3600.0;
var scale = 1.00000561024;
var lambda_zero = central_meridian * deg_to_rad;
var false_northing = -667.711;
var false_easting = 1500064.274;
var e2 = flattening * (2.0 - flattening);
var n = flattening / (2.0 - flattening);
var a_roof = axis / (1.0 + n) * (1.0 + n*n/4.0 + n*n*n*n/64.0);
var A = e2;
var B = (5.0*e2*e2 - e2*e2*e2) / 6.0;
var C = (104.0*e2*e2*e2 - 45.0*e2*e2*e2*e2) / 120.0;
var D = (1237.0*e2*e2*e2*e2) / 1260.0;
var beta1 = n/2.0 - 2.0*n*n/3.0 + 5.0*n*n*n/16.0 + 41.0*n*n*n*n/180.0;
var beta2 = 13.0*n*n/48.0 - 3.0*n*n*n/5.0 + 557.0*n*n*n*n/1440.0;
var beta3 = 61.0*n*n*n/240.0 - 103.0*n*n*n*n/140.0;
var beta4 = 49561.0*n*n*n*n/161280.0;

exports.fromWGS84 = function fromWGS84(location) {
  var rt90 = {x: 0, y: 0};

  var phi = location.latitude * deg_to_rad;
  var lambda = location.longitude * deg_to_rad;

  var phi_star = phi - Math.sin(phi) * Math.cos(phi) *
    (A + B * Math.pow(Math.sin(phi), 2) + C * Math.pow(Math.sin(phi), 4) +
    D * Math.pow(Math.sin(phi), 6));

  var delta_lambda = lambda - lambda_zero;
  var xi_prim = Math.atan(Math.tan(phi_star) / Math.cos(delta_lambda));
  var eta_prim = Math.atanh(Math.cos(phi_star) * Math.sin(delta_lambda));
  var x = scale * a_roof *
    (xi_prim + beta1 * Math.sin(2.0*xi_prim) * Math.cosh(2.0*eta_prim) +
    beta2 * Math.sin(4.0*xi_prim) * Math.cosh(4.0*eta_prim) +
    beta3 * Math.sin(6.0*xi_prim) * Math.cosh(6.0*eta_prim) +
    beta4 * Math.sin(8.0*xi_prim) * Math.cosh(8.0*eta_prim)) + false_northing;

  var y = scale * a_roof *
    (eta_prim + beta1 * Math.cos(2.0*xi_prim) * Math.sinh(2.0*eta_prim) +
    beta2 * Math.cos(4.0*xi_prim) * Math.sinh(4.0*eta_prim) +
    beta3 * Math.cos(6.0*xi_prim) * Math.sinh(6.0*eta_prim) +
    beta4 * Math.cos(8.0*xi_prim) * Math.sinh(8.0*eta_prim)) + false_easting;

  rt90.x= Math.round(Math.round(x * 1000.0) / 1000.0);
  rt90.y = Math.round(Math.round(y * 1000.0) / 1000.0);

  return rt90;
};

exports.toWGS84 = function toWGS84(rt90Coord) {
  var x = rt90Coord.X;
  var y = rt90Coord.Y;

  var delta1 = n/2.0 - 2.0*n*n/3.0 + 37.0*n*n*n/96.0 - n*n*n*n/360.0;
  var delta2 = n*n/48.0 + n*n*n/15.0 - 437.0*n*n*n*n/1440.0;
  var delta3 = 17.0*n*n*n/480.0 - 37*n*n*n*n/840.0;
  var delta4 = 4397.0*n*n*n*n/161280.0;
  var Astar = e2 + e2*e2 + e2*e2*e2 + e2*e2*e2*e2;
  var Bstar = -(7.0*e2*e2 + 17.0*e2*e2*e2 + 30.0*e2*e2*e2*e2) / 6.0;
  var Cstar = (224.0*e2*e2*e2 + 889.0*e2*e2*e2*e2) / 120.0;
  var Dstar = -(4279.0*e2*e2*e2*e2) / 1260.0;
  var xi = (x - false_northing) / (scale * a_roof);
  var eta = (y - false_easting) / (scale * a_roof);
  var xi_prim = xi -
          delta1*Math.sin(2.0*xi) * Math.cosh(2.0*eta) -
          delta2*Math.sin(4.0*xi) * Math.cosh(4.0*eta) -
          delta3*Math.sin(6.0*xi) * Math.cosh(6.0*eta) -
          delta4*Math.sin(8.0*xi) * Math.cosh(8.0*eta);
  var eta_prim = eta -
          delta1*Math.cos(2.0*xi) * Math.sinh(2.0*eta) -
          delta2*Math.cos(4.0*xi) * Math.sinh(4.0*eta) -
          delta3*Math.cos(6.0*xi) * Math.sinh(6.0*eta) -
          delta4*Math.cos(8.0*xi) * Math.sinh(8.0*eta);
  var phi_star = Math.asin(Math.sin(xi_prim) / Math.cosh(eta_prim));
  var delta_lambda = Math.atan(Math.sinh(eta_prim) / Math.cos(xi_prim));
  var lon_radian = lambda_zero + delta_lambda;
  var lat_radian = phi_star + Math.sin(phi_star) * Math.cos(phi_star) *
          (Astar +
           Bstar*Math.pow(Math.sin(phi_star), 2) +
           Cstar*Math.pow(Math.sin(phi_star), 4) +
           Dstar*Math.pow(Math.sin(phi_star), 6));

  return new Location({
    latitude: lat_radian * rad_to_deg,
    longitude: lon_radian * rad_to_deg
  });
};
