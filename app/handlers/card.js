var helpers = require('./helpers.js'),
    requestModule = require('request'),
    async = require('async'),
    cardData = require('../data/card.js'),
    config = require('../local.config.js');

exports.version = "0.1.0";


exports.getCardByName = function (request, responseToSend) {
    //2. Look up the card in the database by its name
    //3. If no results returned, look up via the API
    //4. If no results returned from API, return some form of error
    //5. If any results were found from either, manipulate them and send back

    if (!request.params || !request.params.cardName){
        console.log("No cardName parameter passed");
        var missingParamsError = helpers.missing_params();
        return helpers.send_failure(responseToSend, missingParamsError.code, missingParamsError);
    }

    var cardName = request.params.cardName;

    async.waterfall(
        [
            function(callback){
                cardData.getCardByName(cardName, callback)
            },

            function(card, callback){
                if(card == null){
                    console.log("No card was found in database with name " + cardName + ". Trying API...");
                    getCardByNameAPI(cardName, callback);
                } else if (card){
                    console.log(cardName + " was found in database. Skipping API call...");
                    var transformedCardData = transformCardData(card);
                    callback(null, transformedCardData);
                }
            }
        ],

        function(err, results){
            if(err){
                return helpers.send_failure(responseToSend, err.code, err);
            }

            if(results == null){
                console.log("No results found in either database or API");
                results = {"noResultsFound": true};
            }

            helpers.send_success(responseToSend, results);
        }
    );
};

function getCardByNameAPI(cardName, callback){
    requestModule(config.config.base_api_url + 'card_data/' + cardName, function (err, response, body) {
        if(err){
            return callback(helpers.api_unavailable(), null);
        }

        try{
            var bodyJSON = JSON.parse(body);
        } catch(exception){
            var jsonParseError = helpers.bad_json();
            helpers.send_failure(responseToSend, jsonParseError.code, jsonParseError);
        }

        var transformedSetData = null;

        /*Status == fail if requested card does not exist*/
        if(bodyJSON.status != "fail"){
            transformedSetData = transformCardDataAPI(bodyJSON.data);
        }

        callback(null, transformedSetData);
    });
}

/*For each set returned, create a 'set' object with a name
* and imported status. Defaulted to false initially */
function transformCardData(data){
    var responseObject = {};

    /*Common to all cards*/
    responseObject.name = data.name;
    responseObject.cardType = data.cardType;
    responseObject.text = data.text;
    responseObject.isSpellOrTrap = ((data.cardType == "Spell") || (data.cardType == "Trap"));
    responseObject.insertDate = data.insertDate;
    responseObject.updateDate = data.updateDate;

    if(responseObject.isSpellOrTrap){
        /*Common to spells and traps only*/
        responseObject.property = data.property;
    } else {
        /*Common to monsters only*/
        responseObject.attack = data.attack;
        responseObject.defence = data.defence;
        responseObject.level = data.level;
        responseObject.attribute = data.attribute;
        responseObject.type = data.type;
        responseObject.subType = data.subType;
        responseObject.isComplexSubType = isSubTypeComplex(data.subType);
        if(responseObject.isComplexSubType){
            responseObject.condition = data.condition;
        }
    }

    responseObject.fetchedFromDB = true;

    return responseObject;
}

function transformCardDataAPI(data){
    var responseObject = {};

    data.card_type = capitalizeFirstLetter(data.card_type);

    /*Common to all cards*/
    responseObject.name = data.name;
    responseObject.cardType = data.card_type;
    responseObject.text = data.text;
    responseObject.isSpellOrTrap = ((data.card_type == "Spell") || (data.card_type == "Trap"));

    if(responseObject.isSpellOrTrap){
        /*Common to spells and traps only*/
        responseObject.property = data.property;
    } else {
        /*Common to monsters only*/
        data.family = capitalizeFirstLetter(data.family);
        responseObject.attack = data.atk;
        responseObject.defence = data.def;
        responseObject.level = data.level;
        responseObject.attribute = data.family;

        var typeSplits = data.type.split(' / ');
        responseObject.type = typeSplits[0];
        responseObject.subType = typeSplits[1];

        responseObject.isComplexSubType = isSubTypeComplex(typeSplits[1]);
        if(responseObject.isComplexSubType){
            responseObject.condition = getConditionFromCardText(data.text, responseObject.subType);
        }
    }

    responseObject.fetchedFromDB = false;

    return responseObject;
}

/*Helper methods*/
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getConditionFromCardText(cardText, subtype) {
    console.log()
    if(subtype == "Ritual"){
        return cardText.split('".')[0] + '\".';
    } else {
        return cardText.split("\n\n")[0];
    }
}

function isSubTypeComplex(subtype){
    var complexSubTypes = ['Xyz', 'Fusion', 'Ritual', 'Synchro'];
    return complexSubTypes.includes(subtype);
}