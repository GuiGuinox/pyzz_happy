var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(req, resp) {
  console.log('toto');
  request.get({url:'http://pizzapi.herokuapp.com/pizzas', timeout:4000}, function(error, response, body) {
    console.log('test');
    if (error) {
      if (error.code === 'ETIMEDOUT') {
        console.log('haha')
        resp.render('pages/error');
      }
    }

    console.log('piti');
    if (!error && response.statusCode == 200) {
      var pizzas = JSON.parse(body);
      console.log(pizzas)
      resp.render('pages/index', {pizzas: pizzas});
    }
  });

});

app.post('/doOrder', function(req, resp) {
  var idval = req.body.idPizza;
  console.log(idval);

  request.post({url: 'http://pizzapi.herokuapp.com/orders', timeout:4000}, JSON.stringify({id: idval}), function(error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log('You did it');
      console.log(response)
    }
  });

});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
