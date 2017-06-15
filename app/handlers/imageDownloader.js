var fs = require('fs'),
    request = require('request');

exports.downloadFile = function(uri, filename, callback){

    var fileRequest = request(uri);

    fileRequest.on('response', function (response) {
        /*If we get any other response back than 200 OK, then assume an error occurEed
        * and dont write to the stream.*/
        if(response.statusCode != 200){
            console.log("Download could not be completed, due to the following error: ");
            console.log(err);
            callback(error_fetching_file(), null);
        } else {
            fileRequest.pipe(fs.createWriteStream(filename))
                .on('error', function(err){
                    console.log("Download could not be completed, due to the following error: ");
                    console.log(err);
                    callback(err, null);
                })
                .on('close', function(){
                    callback(null, {status:"success", filename:filename});
                });
        }
    });
};


function error_fetching_file(){
    var e = new Error("error fetching file");
    e.message = "file was not provided by the server. Cannot download.";
    e.code = 501;
    return e;
}