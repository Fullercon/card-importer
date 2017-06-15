var helpers = require('./helpers.js'),
    requestModule = require('request'),
    database = require('../data/database.js'),
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
        compareWithDB(transformedSetData, function(err, dbVerifiedData){
            if(err){
                helpers.send_failure(responseToSend, response.statusCode? response.statusCode : 500, err);
                return;
            }
            helpers.send_success(responseToSend, dbVerifiedData);
        });

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

function isSizeEqualToCardCount(setDB){
    return setDB.size == setDB.cards.length;
}

function compareWithDB(data, callback){
   var cursor = database.sets.find();
   var setList = data.setList;

    cursor.toArray(function(err,results){
        if(err){
            callback(err);
            return;
        }
        results.forEach(function(setDB){
            var indexInSetList = arrayObjectIndexOf(setList, setDB._id, 'name');
            if(indexInSetList != -1){
                setList[indexInSetList].imported = isSizeEqualToCardCount(setDB);
            }
        });

        callback(null, data);
    });
}

/*Helper methods*/
function arrayObjectIndexOf(myArray, searchTerm, property) {
    for(var i = 0, len = myArray.length; i < len; i++) {
        if (myArray[i][property] === searchTerm) return i;
    }
    return -1;
}