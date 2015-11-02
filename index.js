var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var redis = require('redis');
var client = redis.createClient();
var circuitBreaker = require('circuit-breaker-js');
var app = express();
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

app.post('/doOrder', function(req, resp) {
  var idval = req.body.idPizza;
  console.log(idval);

  request.post({url: 'http://pizzapi.herokuapp.com/orders', timeout:4000}, JSON.stringify({id: idval}), function(error, response, body) {
    if (error) {
      console.error(error);
    }

    if (!error && response.statusCode == 200) {
      console.log('You did it');
      console.log(response)
    }
  });

});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
