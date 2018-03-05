var Promise = require('bluebird');
var prettyjson = require('prettyjson');
var config = require('./config');
var coords = config.coords;
var request = require('request');
var dns = require('dns');
var whois = require('whois')


// helper: HTTP GET request -> JSON object or HTML string
function returnJson(url) {
  return new Promise(function(resolve, reject) {
    return request.get(url, function(err, response, body) {
      resolve((isJson(body) ? JSON.parse(body) : body));
    });
  });
}

function isJson(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

function getCoords(ip) {
  let url = 'http://freegeoip.net/json/' + ip;
  return returnJson(url);
}

// return URL to google maps for coordinates
function getGoogleMap(coordinates, zoom, size) {
  if(!zoom) zoom = 10;
  if(!size) size = '400x400';
  let url = 'https://maps.googleapis.com/maps/api/staticmap?center=' + coordinates + '&zoom=' + zoom + '&size=' + size + '&markers&markers=color:blue%7Clabel:S%7C' + coordinates + '&key=' + config.apiKey;
  return url;
}

// get some geolocation data from coordinates using Gogle Maps API
function getCoordData(coordinates) {
  let url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + coordinates;

  return new Promise(function(resolve, reject) {
    return request.get(url, function(err, response, body) {
      let json = JSON.parse(body);
      let row = json.results[0];
      if(!row) return resolve(false);
      let output = {
        city: row.formatted_address, 
        latitude: row.geometry.location.lat,
        longitude: row.geometry.location.lng,
      };
      resolve(output);
    });
  });
}

// domainname -> URL
// TODO: validate URL, etc...
function dnsLookup(url, callback) {
  return new Promise(function(resolve, reject) {
    // TODO: reject if cannot find host
    return dns.lookup(url, function(err, result) {
      console.log(result);
      resolve(result)
    });
  })

}

function whoisLookup(url) {
  return new Promise(function(resolve, reject) {
    return whois.lookup(url, function(err, data) {
      resolve(data);
    });
  });
}

function isLocalIp(ip) {
  return (ip.indexOf('127.0.0.1') > -1 || ip.indexOf('::1') > -1 || ip.indexOf('localhost') > -1);
}

function getExternalIp() {
  return returnJson('http://icanhazip.com').then(function(ip) {
    return Promise.resolve(ip);
  })
}


module.exports = {
  getGoogleMap, 
  getCoordData, 
  getCoords, 
  dnsLookup, 
  whoisLookup, 
  isLocalIp, 
  getExternalIp,
}
