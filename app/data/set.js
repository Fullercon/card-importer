/**
 * Created by Jack on 10/06/2017.
 */

var fs = require('fs'),
    crypto = require("crypto"),
    db = require('./database.js'),
    path = require("path"),
    async = require('async'),
    backhelp = require("./backend_helpers.js");

const sets = db.sets;

exports.version = "0.1.0";

exports.createSet = function (data, callback) {
    var finalSet;
    var writeSucceeded = false;
    console.log('createSet');
    async.waterfall([
        // validate data.
        function (cb) {
            try {
                console.log(JSON.parse(JSON.stringify(data)));
                backhelp.verify(data,
                    [ "_id",
                        "totalCards",
                        "rarities",
                        "imageName",
                        "cards",
                        "insertDate",
                        "updateDate"
                    ]);
                if (!backhelp.validSetName(data._id))
                    throw invalidSetName();
            } catch (e) {
                cb(e);
                return;
            }
            cb(null, data);
        },
            // create the set in mongo.
        function (setData, cb) {
            console.log('createSet2');
            console.log(JSON.parse(JSON.stringify(setData)));
            const write = JSON.parse(JSON.stringify(setData));
            write._id = setData._id;
            db.sets.insertOne(write, { w: 1, safe: true }, cb);
        },

        // make sure the folder exists in our static folder.
        function (results, cb) {
            writeSucceeded = true;
            // console.log(finalSet.toString());
            finalSet = results.ops[0];
            callback(null, finalSet)
        }
    ],
    function (err, results) {
        // convert file errors to something we like.
        if (err) {
            if (writeSucceeded)
                db.sets.deleteOne({ _id: data.name }, function () {});

            if (err instanceof Error && err.code == 11000)
                callback(backhelp.setAlreadyExists());
            else if (err instanceof Error && err.errno != undefined)
                callback(backhelp.file_error(err));
            else
                callback(err);
        } else {
            data ? callback(null, data) : callback(null, null)
        }
    });
};

exports.getSetByName = function (setName, callback) {
    db.sets.find({_id: setName}).toArray(function (err, results) {
        if (err) {
            callback(err);
            return;
        }
        if(results.length === 0) {
            callback(null, null);
        } else if (results.length === 1) {
            callback(null, results[0]);
        } else {
            console.error("more than one set named: " + setName);
            console.error(results);
            callback(backhelp.db_error());
        }
    })
};

exports.updateSetById = function (data, callback) {
    console.log('update set db');
    async.waterfall([
        // validate data
        function (cb) {
            console.log('backupparse');
            console.log(JSON.parse(JSON.stringify(data)));
            try {
                backhelp.verify(data,
                    [ "_id",
                        "totalCards",
                        "rarities",
                        "imageName",
                        "cards",
                        "insertDate",
                        "updateDate",
                        'elementsUpdated'
                    ]);
            } catch (e) {
                cb(e);
                return;
            }
            cb(null, data);
        },

        function (setData, cb) {
            console.log('checking');
            const updatedSetData = JSON.parse(JSON.stringify(setData));
            console.log(updatedSetData.elementsUpdated);
            if (updatedSetData.elementsUpdated === 1) {
                console.log('updateEverything');
                delete updatedSetData['elementsUpdated'];
                updateFullSet(updatedSetData);
            }
            else if (updatedSetData.elementsUpdated === 2)  {
                delete updatedSetData['elementsUpdated'];
                updateRarities(updatedSetData);
            }

            cb(null, updatedSetData)
        }
        ],
        function (err, results) {
            // convert file errors to something we like.
            if (err) {
                console.log('error has occured 1111');
                console.log(err);
                callback(err);
            } else {
                data ? callback(null, data) : callback(null, null)
            }
        });

};

function updateFullSet(updatedSetData) {
    console.log('updating full set :)');
    console.log(updatedSetData);
    db.sets.update(
        {'_id': updatedSetData._id},
        {
            $set: {
                updatedSetData
                //cards: updatedSetData.cards
            }
        }
    )
}

function updateRarities(updatedSetData) {
    console.log('updating set rarities :)');
    db.sets.update(
        {'_id': updatedSetData._id},
        {
            $set: {
                rarities: updatedSetData.rarities,
                cards: updatedSetData.cards,
                updateDate: updatedSetData.updateDate
            }
        }
    )
}

function invalidSetName() {
    return backhelp.error("invalidSetName",
        "Set names can have letters, #s, _, :, & and, -");
}
function invalid_filename() {
    return backhelp.error("invalid_filename",
        "Filenames can have letters, #s, _ and, -");
}
