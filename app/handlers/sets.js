var helpers = require('./helpers.js'),
    requestModule = require('request'),
    setData = require('../data/set.js'),
    database = require('../data/database.js'),
    async = require('async'),
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

        var transformedSetData = transformAllSetsData(bodyJSON);

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
function transformAllSetsData(data){
    var responseObject = {};
    var setList = [];
    data.forEach(function(set){
        setList.push({_id:set, imported:false});
    });
    responseObject.setList = setList;
    return responseObject;
}

function isSizeEqualToCardCount(setDB){
    console.log(setDB.size);
    console.log(setDB.cards.length);
    return setDB.totalCards === setDB.cards.length;
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
            if(setDB._id) console.log(setDB._id);
            var indexInSetList = arrayObjectIndexOf(setList, setDB._id, '_id');
            if(indexInSetList != -1){
                setList[indexInSetList].imported = isSizeEqualToCardCount(setDB);
            }
        });

        callback(null, data);
    });
}

/*Helper methods*/
function arrayObjectIndexOf(myArray, searchTerm, property) {
    var i = 0, len = myArray.length;
    for(i; i < len; i++) {
        if (myArray[i][property] === searchTerm) return i;
    }
    return -1;
}