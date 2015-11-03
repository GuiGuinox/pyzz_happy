var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var redis = require('redis');
var client = redis.createClient();
//var client = redis.createClient(6379,'10.0.2.15', {no_ready_check: true});
var CB = require('circuit-breaker-js');
var librato = require('librato-node');
var circuitBreaker = new CB();
var app = express();
var maintenance = false;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(librato.middleware());


app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

//init librato
/*librato.configure({email: 'elsa.rousselbach@gmail.com', token: '4027901d9bbe05df3e4a955566b7bcfbbe7f4e33fa42c8f1765ea0b78e89dff3'});
librato.start();*/
librato.configure({email: 'guillaume.jourdain2@gmail.com', token: '05712dd8bde392901ff889a93da21dd73866a68b58a80ebda4587269c06bdf62'});
librato.start();

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

client.on('error', function(err) {
  console.log('Error ' + err);
});

app.get('/', function(req, resp) {
  librato.increment('listPizza');
  var timeout = setTimeout(function() {
    client.end();
    resp.render('pages/error');
  }, 4000);

  maintenance = circuitBreaker.isOpen();
  client.get('pizzas', function(err, reply) {
    console.log(reply)
    pizzas = JSON.parse(reply);
    console.log(pizzas);
    if (timeout) {
      clearTimeout(timeout);
    }

    resp.render('pages/index', {pizzas: pizzas, maintenance: maintenance});
  });

});

circuitBreaker.onCircuitOpen = function(metrics) {
  maintenance = true;
  liberato.measure('circuitBreaker', 1);
  console.log('open ' + maintenance);
}

circuitBreaker.onCircuitClose = function(metrics) {
  maintenance = false;
  liberato.measure('circuitBreaker', 0);
  console.log('close ' + maintenance);
}

app.post('/doOrder', function(req, resp) {
  librato.increment('doOrders');
  var idval = parseInt(req.body.idPizza);
  console.log(idval);

  var command = function(success, failed) {
    console.log('COMMAND')
    request.post({url: 'http://pizzapi.herokuapp.com/orders', timeout: 4000, body: JSON.stringify({id: idval})}, function(error, response, body) {
      console.log(response);
      if (error || response.statusCode === 503) {
        librato.measure('statusCode', response.statusCode);
        console.log(body);
        console.error(response.statusCode);
        failed();
        console.log('test2');
        return resp.render('pages/error');
      }

      else {
        librato.measure('statusCode', response.statusCode);
        success();
        console.log('You did it');
        console.log(response)
        return resp.redirect('/');

      }
    });
  };

  var fallback = function() {
    console.log('truc');
  };

  circuitBreaker.run(command, fallback);

});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});