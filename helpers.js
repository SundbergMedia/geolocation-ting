var Promise = require('bluebird');
var config = require('./config');
var request = require('request');
var coords = config.coords;
var dns = require('dns');
var whois = require('whois');
var log = console.log;
require('dotenv').config();

const MAPS_API_URL = 'https://maps.googleapis.com/maps/api/';
const GEOLOCATION_API_URL = 'http://freegeoip.net/json/';
const EXTERNAL_IP_URL = 'http://icanhazip.com';
const EXTERNAL_IP = process.env.EXTERNAL_IP;

// helper: HTTP GET request -> JSON object or HTML string
function returnJson(url) {
  return new Promise(function(resolve, reject) {
    return request.get(url, function(err, response, body) {
      return resolve((isJson(body) ? JSON.parse(body) : body));
    });
  });
}

// helper: if string is valid JSON
function isJson(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

// helper; get data for IP
function getIpData(ip) {
  log('Get data for IP:', ip);
  return new Promise(function(resolve, reject) {
    if(!ip || ip == undefined) return resolve('(no data)');
    if(isLocalIp(ip)) ip = process.env.EXTERNAL_IP; // use local external IP if local IP

    // TODO: this needs to be wrapped in a separated helper...
    // resolveHostName // ?
    return dnsLookup(ip).then(function(ip) {
      return getCoords(ip);
    })
    .then(function(data) {
      log('COORDS:', data);
      let extra = data;
      let coords = data.latitude + ',' + data.longitude;
      // TODO: support for returnig coords only, since google quota is limited...
      getCoordData(coords).then(function(data) {
        data.ip = ip;
        data.extra = extra;
        return resolve(prepareIpData(data));
      })
    })
  });
}

// helper: prepare parsed IP data for output
function prepareIpData(data) {
  data.map = getGoogleMap(coords);
  data.mapZoomed = getGoogleMap(coords, 13); // extra zoom
  data.mapZoomedAlt = false;
  
  if(data.extra.latitude) {
    let diffCoords = data.extra.latitude + ',' + data.extra.longitude;
    data.mapZoomedAlt = getGoogleMap(diffCoords, 13);
  }

  return data;
}

function getCoords(ip) {
  return returnJson(GEOLOCATION_API_URL + ip);
}

// return URL to google maps for coordinates
// TODO: cache maps locally in order to avoid overusing dat daily quata
function getGoogleMap(coordinates, zoom, size) {
  if(!zoom) zoom = 10;
  if(!size) size = '400x400';
  let url = MAPS_API_URL + 'staticmap?center=' + coordinates + '&zoom=' + zoom + '&size=' + size + '&markers&markers=color:blue%7Clabel:S%7C' + coordinates + '&key=' + config.apiKey;
  return url;
}

// get some geolocation data from coordinates using Gogle Maps API
function getCoordData(coordinates) {
  let url = MAPS_API_URL + "geocode/json?address=" + coordinates;
  log('>> URL', url);
  return new Promise(function(resolve, reject) {
    return request.get(url, function(err, response, body) {
      let json = (isJson(body) ? JSON.parse(body) : body);
      if(!json || json == undefined || !json.results || !json.results[0]) return resolve('unparsable data: ' + body);
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
    if(!isDomain(url)) return resolve(url); // avoid lookup when handling IP addresses
    return dns.lookup(url, function(err, result) {
      if(err) reject(err);
      console.log(result);
      resolve(result)
    });
  })
}

function whoisLookup(url) {
  return new Promise(function(resolve, reject) {
    return whois.lookup(url, function(err, data) {
      if(err) reject(err);
      resolve(data);
    });
  });
}

function isLocalIp(ip) {
  return (ip.indexOf('127.0.0.1') > -1 || ip.indexOf('::1') > -1 || ip.indexOf('localhost') > -1);
}

// contains at least 2 alpha chars and a .
function isDomain(name) {
  return (name.match(/[a-z]/i));
}

function getExternalIp() {
  return returnJson(EXTERNAL_IP_URL).then(function(ip) {
    return Promise.resolve(ip);
  })
}


// get external IP on init
// (function() {
//   console.log('INIT');
//   getExternalIp().then(function(ip) {
//     console.log('External IP:', ip);
//     localIp = ip; // set local external IP
//     // process.exit(); // kill a kill
//   })
// })();


module.exports = {
  getGoogleMap, 
  getCoordData, 
  getCoords, 
  dnsLookup, 
  whoisLookup, 
  isLocalIp, 
  getExternalIp,
  getIpData,
  resolveHostName,
}
