var MongoClient = require('mongodb').MongoClient,
    async = require('async'),
    local = require('../local.config.js');

/**
 * We'll keep this private and not share it with anybody.
 */
var db;

exports.init = function (callback) {
    async.waterfall([
        // 1. open database connection
        function (cb) {
            console.log("\n** 1. open db");
            var url = local.config.db_config.host_url;
            console.log(url);
            MongoClient.connect(url, function (err, dbase) {
                if (err) return cb(err);
            console.log("**    Connected to server");
            db = dbase;
            cb(null);
        });
        },

        // 2. create collections for our albums and photos. if
        //    they already exist, then we're good.
        function (cb) {
            console.log("** 2. create sets and cards collections.");
            db.collection("sets", cb);
        },

        function (setsColl, cb) {
            exports.sets = setsColl;
            db.collection("cards", cb);
        },

        function (cardsColl, cb) {
            exports.cards = cardsColl;
            cb(null);
        }
    ], callback);
};

