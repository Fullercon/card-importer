var helpers = require('./helpers.js'),
    requestModule = require('request'),
    async = require('async'),
    cardData = require('../data/card.js'),
    sanitize = require('sanitize-filename'),
    fs = require('fs-extra'),
    downloader = require('./imageDownloader.js'),
    config = require('../local.config.js');

exports.version = "0.1.0";


exports.getCardByName = function (request, responseToSend) {
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

exports.importCardImage = function (request, responseToSend) {

    //1. Extract post parameters from request (cardName), validate they exist
    //2. Convert cardName to a valid filename(so we can save it to a windows file system
    //3. Verify if the image already exists in static/images
    //4.If it doesn't, import it into the folder!

    console.log("Importing card image!");

    console.log(request);
    if(!request.body || !request.body.cardName){
        console.log("Missing parameters");
        var missingParams = helpers.missing_data("cardName");
        return helpers.send_failure(responseToSend, missingParams.code, missingParams);
    }

    console.log(request.body);
    var cardName = request.body.cardName;

    console.log("Stripping out invalid characters for a filename");
    var validFilename = sanitize(cardName) + '.png';

    var fullFilePath = '../static/images/' + validFilename;

    async.waterfall(
        [
            function(callback){
                console.log("Verifying if image " + validFilename + " already exists in directory...");
                fs.pathExists(fullFilePath, callback);
            },

            function(fileExists, callback){
                if(fileExists){
                    console.log("Not importing as image already exists");
                    var imageExistsError = helpers.image_exists_error();
                    return callback(imageExistsError, null);
                }
                console.log("Downloading image from API as not in static/images directory");
                downloader.downloadFile(config.config.base_api_url + 'card_image/' + cardName, fullFilePath, callback);
            }
        ],

        function(err, results){
            if(err){
                console.log(err);
                return helpers.send_failure(responseToSend, err.code, err);
            }

            if(results && results.status == "success"){
                console.log("Image for " + cardName  + " was successfully saved as " + validFilename);
                helpers.send_success(responseToSend, results);
            }
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
            return helpers.send_failure(responseToSend, jsonParseError.code, jsonParseError);
        }

        var transformedSetData = null;

        /*Status == fail if requested card does not exist*/
        if(bodyJSON.status != "fail"){
            transformedSetData = transformCardDataAPI(bodyJSON.data);
        }

        callback(null, transformedSetData);
    });
}

function transformCardData(data){
    var responseObject = {};

    /*Common to all cards*/
    responseObject.name = data.name;
    responseObject.cardType = data.cardType;
    responseObject.text = data.text;
    responseObject.isSpellOrTrap = ((data.cardType == "Spell") || (data.cardType == "Trap"));
    responseObject.insertDate = data.insertDate;
    responseObject.updateDate = data.updateDate;
    responseObject.imageName = data.imageName ? data.imageName : "Blue-Eyes White Dragon.png";

    if(responseObject.isSpellOrTrap){
        /*Common to spells and traps only*/
        responseObject.property = data.property;
    } else {
        /*Common to monsters only*/
        responseObject.attack = data.attack;
        responseObject.defence = data.defence;
        responseObject.levels = generateLevelArray(data.level);
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
    responseObject.imageName = "DefaultImage.png";

    if(responseObject.isSpellOrTrap){
        /*Common to spells and traps only*/
        responseObject.property = data.property;
    } else {
        /*Common to monsters only*/
        data.family = capitalizeFirstLetter(data.family);
        responseObject.attack = data.atk;
        responseObject.defence = data.def;
        responseObject.levels = generateLevelArray(data.level);
        responseObject.attribute = data.family;

        var typeSplits = data.type.split(' / ');
        responseObject.type = typeSplits[0];
        responseObject.subType = typeSplits[1];

        if(typeSplits[1] == undefined){
            responseObject.subType = "Normal";
        }

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

function generateLevelArray(levelNumber){
    var levelArray = [];
    for(i = 1 ; i <= levelNumber; i++){
        levelArray.push(i);
    }
    return levelArray;
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