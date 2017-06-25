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
            var write = JSON.parse(JSON.stringify(setData));
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

function invalidSetName() {
    return backhelp.error("invalidSetName",
        "Set names can have letters, #s, _, :, & and, -");
}
function invalid_filename() {
    return backhelp.error("invalid_filename",
        "Filenames can have letters, #s, _ and, -");
}
