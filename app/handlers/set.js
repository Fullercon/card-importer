var helpers = require('./helpers.js'),
    requestModule = require('request'),
    setData = require('../data/set.js'),
    database = require('../data/database.js'),
    config = require('../local.config.js'),
    async = require('async');

exports.version = "0.1.0";

exports.getSetByName = function (request, responseToSend) {
    if (!request.params || !request.params.setName){
        console.log("No setName parameter passed");
        var missingParamsError = helpers.missing_params();
        return helpers.send_failure(responseToSend, missingParamsError.code, missingParamsError);
    }

    const setName = request.params.setName.split('.html')[0];
    console.log('test');
    console.log(setName);
    async.waterfall(
        [
            function(callback){
                setData.getSetByName(setName, callback)
            },

            function(set, callback){
                if(set === null){
                    console.log("No set was found in database with name " + setName + ". Trying API...");
                    getCardByNameAPI(setName, callback);
                } else if (set){
                    console.log(setName + " was found in database. Skipping API call...");
                    var transformedSetData = transformSetServerData(set);
                    callback(null, transformedSetData);
                }
            },
            function(transformedSetData, callback) {
                console.log('wooo');
                console.log(transformedSetData.fetchedFromDB);
                // console.log(transformedSetData.fetchedFromDB.toString());
                if (!transformedSetData.fetchedFromDB) {
                    console.log('creating');
                    setData.createSet(transformedSetData, callback);
                    // callback(null, transformedSetData);
                } else {
                    console.log('notCreating');
                    callback(null, transformedSetData);
                }
            }
        ],

        function(err, results){
            if(err){
                return helpers.send_failure(responseToSend, err.code, err);
            }

            if(!results){
                console.log("No results found in either database or API");
                results = {"noResultsFound": true};
            }

            helpers.send_success(responseToSend, results);
        }
    );
};

function getCardByNameAPI (setName, callback) {
    console.log('API');
    console.log(setName);
    requestModule(config.config.base_api_url + 'set_data/' + setName, function (err, response, body) {
        if (err) {
            console.log('error');
            return callback(helpers.api_unavailable(), null);
        }

        try{
            var bodyJSON = JSON.parse(body);
            console.log(bodyJSON);
        } catch(exception){
            var jsonParseError = helpers.bad_json();
            return helpers.send_failure(responseToSend, jsonParseError.code, jsonParseError);
        }

        var transformedSetData = null;

        /*Status == fail if requested card does not exist*/
        if(bodyJSON.status != "fail"){
            transformedSetData = transformSetDataAPI(setName, bodyJSON.data);
        }

        callback(null, transformedSetData);
    })
}

function transformSetServerData (data) {
    var responseObject = {};

    /*Common to all sets*/
    responseObject._id = data._id;
    responseObject.totalCards = data.totalCards;
    responseObject.rarities = data.rarities;
    responseObject.cards = data.cards;
    responseObject.imageName = data.imageName ? data.imageName : "DefaultImage.png";
    responseObject.insertDate =  data.insertDate;
    responseObject.updateDate =  data.updateDate;

    responseObject.fetchedFromDB = true;

    return responseObject;
}


function transformSetDataAPI (setName, data){
    var responseObject = {};
    var cards = [];
    var totalCards = 0;
    var d, rarity, cardName, cardId, rarities = [];
    /*Common to all sets*/
    responseObject._id = setName;
    console.log(data.cards);


    for (d in data.rarities) {
        if (data.rarities.hasOwnProperty(d)) {
            var obj = {
                rarity: d,
                number: data.rarities[d]
            };
            rarities.push(obj);
        }
    }

    data.cards.forEach(function (item) {
        item.numbers.forEach(function(numbers, index) {
            cardName = item.name;
            console.log('dhjshdhsfhdsgfgdsgfjdgjsfgjdgsgfdhdf');
            console.log(numbers.rarity);
            rarity = numbers.rarity;
            var obj = {
                cardName: cardName,
                rarity: rarity
            };
            cards.push(obj);
            totalCards++;
        });
    });

    responseObject.rarities = rarities;
    responseObject.totalCards = totalCards;
    responseObject.cards = cards;
    responseObject.insertDate =  new Date();
    responseObject.updateDate =  new Date();
    responseObject.imageName = data.imageName ? data.imageName : "DefaultImage.png";
    responseObject.fetchedFromDB = false;

    return responseObject;
}

/*Helper methods*/
function arrayObjectIndexOf(myArray, searchTerm, property) {
    for(var i = 0, len = myArray.length; i < len; i++) {
        if (myArray[i][property] === searchTerm) return i;
    }
    return -1;
}