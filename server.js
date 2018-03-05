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
var bunyan = require('bunyan');
var chalk = require('chalk');
var logger = bunyan.createLogger({name: "drink-routes"});
var log = console.log; // TODO: logger.info() w/ concat arguments
// log('ENVIRONMENT VARS:', process.env);


// temp configs
var localIp = '90.227.59.52';
// var coords = '57.6667,14.95';    // Eksjö
var coords = '57.614574,15.584994'; // Mariannelund
var app = express();

// app config
// app.use(express.static(__dirname)); // danger!
app.use(express.static(__dirname + '/dist'));
app.set('view engine', 'pug')
app.set('views', __dirname);
app.use('/data', require('./routes.js'));
app.locals.pretty = true;



// index page; get data for the client's IP address
app.get('/', function (req, res) {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;  
  getIpData(ip).then(function(data) {
    log('DATA:', data);
    res.json(data);
  });

});

// spin up the server
app.listen(config.port, function () {
  log(config.name, 'server running on port:', config.port);
});
