var async = require('async'),
    db = require('../data/database.js');

exports.getCardByName = function(name, callback){
    var cursor = db.cards.find({"name":name});

    cursor.toArray(function(err,results){
        if(err){
            callback(err);
            return;
        }
        //No results found
        if(results.length==0){
            callback(null, null);
        } else{
            /*Even if multiple returned (i.e. same card different rarity,
            just return any as the card data will be the same)*/
            callback(null, results[0]);
        }
    });
};