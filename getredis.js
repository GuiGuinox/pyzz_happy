var redis = require('redis');
var client = redis.createClient();
// var client = redis.createClient(port, 6379);
var request = require('request');

// if you'd like to select database 3, instead of 0 (default), call
// client.select(3, function() { /* ... */ });
//

client.on('connect', function() {
  console.log('connected');
  console.log(client);
});

client.on('error', function(err) {
  console.log('Error ' + err);
});

setInterval(function() {

  console.log('titi');
  request('http://pizzapi.herokuapp.com/pizzas', function(error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body);
      client.set('pizzas', body, function(err, res) {
        console.log(err);
        console.log('toto');
      });
    }
  });
}, 60000);
