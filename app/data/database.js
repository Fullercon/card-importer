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

        function (sets_coll, cb) {
            exports.sets = sets_coll;
            db.collection("cards", cb);
        },

        function (photos_coll, cb) {
            exports.cards = photos_coll;
            cb(null);
        }
    ], callback);
};


//
// var Db = require('mongodb').Db,
//     Connection = require('mongodb').Connection,
//     Server = require('mongodb').Server,
//     async = require('async'),
//     local = require('../local.config.js');
//
// var host = local.config.db_config.host ? local.config.db_config.host : "localhost";
// var port = local.config.db_config.port ? local.config.db_config.port : Connection.DEFAULT_PORT;
// var poolSize = local.config.db_config.poolSize ? local.config.db_config.poolSize : 5;
//
// var db = new Db('Cards',
//                 new Server(host, port, {auto_reconnect:true,
//                                         poolSize:poolSize}),
//                 {w:1});
//
// exports.init = function(callback){
//
//     /*Dont need final results function as we just pass results back to caller*/
//     async.waterfall([
//         //1. open db connection
//         function(innerCallback){
//             db.open(innerCallback);
//         },
//         function(openedDb, innerCallback){
//             db.collection("sets", innerCallback);
//         },
//         function(setsCollection, innerCallback){
//             exports.sets = setsCollection;
//             db.collection("cards", innerCallback);
//         },
//         function(cardsCollection, innerCallback){
//             exports.cards = cardsCollection;
//             innerCallback(null);
//         }
//     ],callback);
// };
//
// exports.sets = null;
// exports.cards = null;


