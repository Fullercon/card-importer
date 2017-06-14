var express = require('express');
var app = express();

var helpers = require('./handlers/helpers.js'),
	pages = require('./handlers/pages.js'),
	sets = require('./handlers/sets.js'),
    card = require('./handlers/card.js'),
    database = require('./data/database');

app.use(express.static(__dirname + "/../static"));
app.use(express.bodyParser());


app.get('/v1/sets.json', sets.getAllSets);
app.get('/v1/card/:cardName.json', card.getCardByName);
app.put('/v1/import/cardImage.json', card.importCardImage);


app.get('/pages/:page_name', pages.generate);
app.get('/pages/:page_name/:sub_page', pages.generate);
app.get('/', function(request, response){
	response.redirect('pages/sets');
	response.end();
});

app.get('*', four_oh_four);

function four_oh_four(req, res){
    console.log('404ing!');
    helpers.send_failure(res, 404, helpers.invalid_resource());
}

database.init(function(err, results){
    if(err){
        console.error("FATAL ERROR ON DB START UP: ");
        console.error(err);
        process.exit(-1);
    }
    console.log("Database initialised. Starting listening on port 8080...");
    app.listen(8080);
});


