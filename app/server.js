var express = require('express');
var app = express();

var helpers = require('./handlers/helpers.js'),
	pages = require('./handlers/pages.js'),
	sets = require('./handlers/sets.js');

app.use(express.static(__dirname + "/../static"));


app.get('/v1/sets.json', sets.getAllSets);
app.get('/pages/:page_name', pages.generate);

app.get('/', function(request, response){
	response.redirect('pages/sets');
	response.end();
});

app.get('*', four_oh_four);

function four_oh_four(req, res){
    console.log('404ing!');
    helpers.send_failure(res, 404, helpers.invalid_resource());
}

app.listen(8080);



