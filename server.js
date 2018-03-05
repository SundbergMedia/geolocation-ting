/*
 * Geolocation service
 * Currently using external API geolocation services
 * TODO: use IP location database from:
 * https://lite.ip2location.com/database/ip-country-region-city-latitude-longitude 
 */


// dependencies
require('dotenv').config();
var _ = require('lodash');
var config = require('./config');
var helpers = require('./helpers');
var request = require("request");
var express = require('express');
var Promise = require('bluebird');
var app = express();
var log = console.log;


// app config
// app.use(express.static(__dirname)); // danger!
app.use(express.static(__dirname + '/dist'));
app.set('view engine', 'pug')
app.set('views', __dirname);
app.use('/data', require('./routes.js'));
app.locals.pretty = true;


function getIp(req) {
  return req.params.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
}

// helper; get data for IP
// TODO: moved to helpers.getAndParseIpData
function getIpData(ip) {
  log('Get data for IP:', ip);
  return new Promise(function(resolve, reject) {
    if(!ip || ip == undefined) return resolve('(no data)');
    if(helpers.isLocalIp(ip)) ip = process.env.EXTERNAL_IP; // use local external IP if local IP

    // TODO: this needs to be wrapped in a separated helper...
    helpers.dnsLookup(ip).then(function(ip) {
      return helpers.getCoords(ip);
    })
    // .then(helpers.getCoords())
    .then(function(data) {
      log('COORDS dataa:', data);
      let extra = data;
      let coords = data.latitude + ',' + data.longitude;
      helpers.getCoordData(coords).then(function(data) {
        data.ip = ip;
        data.extra = extra;
        data.map = helpers.getGoogleMap(coords);
        data.mapZoomed = helpers.getGoogleMap(coords, 13); // extra zoom        
        return data;
        // resolve(data);
      })
      .then(resolve);
    })
    // .then(resolve);
  });
}

// index page; get data for the client's IP address
app.get('/', function (req, res) {
  getIpData(getIp(req)).then(function(data) {
    log('DATA:', data);
    res.render('template', { herp: 'Geolocation ting', data: data }) // render HTML template
    // res.json(data);
  });
});

// get options for external IP
app.get('/ip/:ip', function (req, res) {
  getIpData(getIp(req)).then(function(data) {
    data.input = req.params.ip;
    log('DATA:', data); // log output data
    res.render('template', { herp: 'Stats for ' + ip, data: data }) // render HTML template
  });

});

// whois lookup
// TODO: validate domain name
app.get('/whois/:domain', function (req, res) {  
  helpers.whoisLookup(req.params.domain).then(function(data) {
    res.send('<pre>' + data + '</pre>');
  })
});

// spin up the server
app.listen(config.port, function () {
  log(config.name, 'server running on port:', config.port);
});
