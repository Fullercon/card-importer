/**
 * Created by Jack on 10/06/2017.
 */

var fs = require('fs'),
    crypto = require("crypto"),
    local = require('../local.config.json'),
    db = require('./database.js'),
    path = require("path"),
    async = require('async'),
    backhelp = require("./backend_helpers.js");

exports.version = "0.1.0";

exports.createSet = function (data, callback) {
    var finalSet;
    var writeSucceeded = false;
    async.waterfall([
        // validate data.
        function (cb) {
            try {
                backhelp.verify(data,
                    [ "_id",
                        "totalCards",
                        "rarities",
                        "image",
                        "cards"
                    ]);
                if (!backhelp.validSetName(data._id))
                    throw invalidSetName();
            } catch (e) {
                cb(e);
                return;
            }
            cb(null, data);
        },
            // create the album in mongo.
        function (setData, cb) {
            var write = JSON.parse(JSON.stringify(setData));
            write._id = setData.name + '_' + setData.rarity;
            db.sets.insertOne(write, { w: 1, safe: true }, cb);
        },

        // make sure the folder exists in our static folder.
        function (results, cb) {
            writeSucceeded = true;
            finalSet = results.ops[0];
            //fs.mkdir(local.config.static_content
          //      + "sets/" + data.name, cb);
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
            callback(err, err ? null : final_album);
        }
    });
};


function invalidSetName() {
    return backhelp.error("invalidSetName",
        "Set names can have letters, #s, _ and, -");
}
function invalid_filename() {
    return backhelp.error("invalid_filename",
        "Filenames can have letters, #s, _ and, -");
}
