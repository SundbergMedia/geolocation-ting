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


// get external IP on init
// (function() {
//   console.log('INIT');
//   helpers.getExternalIp().then(function(ip) {
//     console.log('External IP:', ip);
//     localIp = ip; // set local external IP
//     // process.exit(); // kill a kill
//   })
// })();


// helper; get data for IP
function getIpData(ip) {
  log('Get data for IP:', ip);
  return new Promise(function(resolve, reject) {
    if(!ip || ip == undefined) return resolve('(no data)');
    if(helpers.isLocalIp(ip)) ip = localIp; // use local external IP if local IP

    // TODO: this needs to be wrapped in a separated helper...
    helpers.dnsLookup(ip)
    .then(helpers.getCoords())
    .then(function(data) {
      log('COORDS dataa:', data);
      let extra = data;
      let coords = data.latitude + ',' + data.longitude;
      helpers.getCoordData(coords).then(function(data) {
        data.ip = ip;
        data.extra = extra;
        data.map = helpers.getGoogleMap(coords);
        data.mapZoomed = helpers.getGoogleMap(coords, 13); // extra zoom
        
        if(data.extra.latitude) {
          let diffCoords = data.extra.latitude + ',' + data.extra.longitude;
          data.mapZoomedAlt = helpers.getGoogleMap(diffCoords, 13);
        } else {
          data.mapZoomedAlt = false;
        }
        return data;
        // resolve(data);
      })
      .then(resolve);
    })
    // .then(resolve);
  });
}

// helper: revolve domain name to IP adress by DNS lookup
function resolveHostName(address) {
  return new Promise(function(resolve, reject) {
    // reject if missing address
    if(!address || address == undefined) return reject('(no data)');

    if(address.match(/[a-z]/i)) {
      // try resolve by DNS lookup
      // TODO: validate URL?
      resolve(helpers.dnsLookup(address));
    } else {
      // TODO: validate IP address
      resolve(address);
    }

  }); 
}

// index page; get data for the client's IP address
app.get('/', function (req, res) {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;  
  getIpData(ip).then(function(data) {
    log('DATA:', data);
    res.json(data);
  });

});

// get options for external IP
app.get('/ip/:ip', function (req, res) {
  var ip = req.params.ip;
  log(chalk.red('GETTING INFO FOR ADDRESS:' + ip));
  log(chalk.blue('Hello') + ' World' + chalk.red('!'));

  getIpData(ip).then(function(data) {
    data.input = req.params.ip;
    log('DATA:', data);
    res.render('template', { herp: 'Stats for ' + ip, data: data }) // render HTML template
  });

});

// whois lookup
// TODO: validate domain name
app.get('/whois/:domain', function (req, res) {  
  helpers.whoisLookup(req.params.domain).then(function(data) {
    log('WHOIS data:', data);
    res.send('<pre>' + data + '</pre>');
  })
});

// spin up the server
app.listen(config.port, function () {
  log(config.name, 'server running on port:', config.port);
});
