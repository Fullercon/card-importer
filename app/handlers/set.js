var helpers = require('./helpers.js'),
    requestModule = require('request'),
    setDB = require('../data/set.js'),
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
                setDB.getSetByName(setName, callback)
            },

            function(set, callback){
                if(set === null){
                    console.log("No set was found in database with name " + setName + ". Trying API...");
                    getSetByNameAPI(setName, callback);
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
                    setDB.createSet(transformedSetData, callback);
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

exports.updateSetById = function (request, responseToSend) {
    async.waterfall([
        // make sure we have everything we need.
        function (cb) {
            if (!request.params || !request.params.setName) {
                console.log("No setName parameter passed");
                const missingParamsError = helpers.missing_params();
                cb(missingParamsError);
            }
            else if (!request.body) {
                cb(helpers.missing_data("POST data"));
            }
            else {
                console.log('waterfall 1 done');
                // get the album
                cb(null, request.body)
            }
        },

        function (setData, cb) {
            setDB.updateSetById(setData, cb)
        }
    ],
    function (err, result) {
        if (err) {
            helpers.send_failure(responseToSend, helpers.http_code_for_error(err), err);
            return;
        }
        helpers.send_success(responseToSend, result);
    });
};


function getSetByNameAPI (setName, callback) {
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
                rarityNoSpaces: d.replace(/\s/g,''),
                number: data.rarities[d]
            };
            rarities.push(obj);
        }
    }

    data.cards.forEach(function (item) {
        item.numbers.forEach(function(numbers, index) {
            cardName = item.name;
            rarity = numbers.rarity;
            var obj = {
                cardName: cardName,
                rarity: rarity,
                rarityNoSpaces: rarity.replace(/\s/g,'')
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