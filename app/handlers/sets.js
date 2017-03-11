var helpers = require('./helpers.js'),
    requestModule = require('request'),
    config = require('../local.config.js');

exports.version = "0.1.0";

exports.getAllSets = function (request, responseToSend) {
    requestModule(config.config.base_api_url + 'card_sets', function (err, response, body) {
        if(err){
            helpers.send_failure(responseToSend, response.statusCode? response.statusCode : 500, err);
            return;
        }

        try{
            var bodyJSON = JSON.parse(body);
        } catch(exception){
            var jsonParseError = helpers.bad_json();
            helpers.send_failure(responseToSend, jsonParseError.code, jsonParseError);
        }
        var transformedSetData = transformSetData(bodyJSON);
        helpers.send_success(responseToSend, transformedSetData);
    });
};

/*For each set returned, create a 'set' object with a name
* and imported status. Defaulted to false initially */
function transformSetData(data){
    var responseObject = {};
    var setList = [];
    data.forEach(function(set){
        setList.push({name:set, imported:false});
    });
    responseObject.setList = setList;
    return responseObject;
}