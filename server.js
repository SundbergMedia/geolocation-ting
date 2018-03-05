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
app.use(express.static(__dirname + '/dist'));
app.set('view engine', 'pug')
app.set('views', __dirname);
app.use('/data', require('./routes.js'));
app.locals.pretty = true;


function getIp(req) {
  return req.params.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
}

// index page; get data for the client's IP address
app.get('/', function (req, res) {
  helpers.getIpData(getIp(req)).then(function(data) {
    log('DATA:', data);
    res.render('template', { herp: 'Geolocation ting', data: data }) // render HTML template
  });
});

// get data for external IP or domain name
app.get('/ip/:ip', function (req, res) {
  var ip = getIp(req);
  helpers.getIpData(ip).then(function(data) {
    data.input = ip;
    log('DATA:', data);
    res.render('template', { herp: 'Stats for ' + ip, data: data }) // render HTML template
  });
});

// WHOIS lookup for domain name
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
