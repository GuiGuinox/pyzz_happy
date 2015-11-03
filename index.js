var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var redis = require('redis');
var client = redis.createClient();

// var client = redis.createClient(6379, host);
var CB = require('circuit-breaker-js');
var circuitBreaker = new CB();
var app = express();
var maintenance = false;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

client.on('error', function(err) {
  console.log('Error ' + err);
});

app.get('/', function(req, resp) {

  var timeout = setTimeout(function() {
    client.end();
    resp.render('pages/error');
  }, 4000);

  client.get('pizzas', function(err, reply) {
    console.log(reply)
    pizzas = JSON.parse(reply);
    console.log(pizzas);
    if (timeout) {
      clearTimeout(timeout);
    }

    resp.render('pages/index', {pizzas: pizzas});
  });

});

circuitBreaker.onCircuitOpen = function(metrics) {
  maintenance = true;
  console.log('open ' + maintenance);
}

circuitBreaker.onCircuitClose = function(metrics) {
  maintenance = false;
  console.log('close ' + maintenance);
}

app.post('/doOrder', function(req, resp) {
  var idval = req.body.idPizza;
  console.log(idval);

  var command = function(success, failed) {
    request.post({url: 'http://pizzapi.herokuapp.com/orders', timeout:4000}, JSON.stringify({id: idval}), function(error, response, body) {
      if (error) {
        failed();
      }

      if (!error && response.statusCode == 200) {
        success();
        console.log('You did it');
        console.log(response)
      }
    })
      .done(success())
      .fail(failed());
  };

  var fallback = function() {
    alert('Service is down');
  };

  circuitBreaker.run(command, fallback);

});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
