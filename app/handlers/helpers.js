exports.version = '0.1.0';

exports.make_error = function(err, msg){
    var e = new Error(msg);
    e.code = 500;
    return e;
};

exports.send_success = function(response, data){
    var output = {error: null, data:data};
    response.writeHead(200, {"Content-Type" : "application/json"});
    response.end(JSON.stringify(output) + "\n");
    console.log('success')
};

exports.send_failure = function(response, code, err){
    console.log("sending failure");
    var code = code ? code : err.code;
    response.writeHead(code, {"Content-Type" : "application/json"});
    response.end(JSON.stringify({error: code, message: err.message}) + "\n");
};


exports.invalid_resource = function() {
    return exports.make_error("invalid_resource", "the requested resource does not exist.");
};

exports.api_unavailable = function() {
    return exports.make_error("api_unavailable", "the external api was not available at this time.");
};

exports.bad_json = function(){
    return exports.make_error("bad_json", "the data is not in a valid JSON format");
};

exports.missing_params = function(){
    return exports.make_error("missing_params", "the request did not contain the necessary parameters to identify the resource.");
};

exports.image_exists_error = function(){
    return exports.make_error("missing_params", "refusing to import as image for this card already exists in the directory.");
};

exports.missing_data = function(data_field){
    return exports.make_error("missing_data", "Expected " + data_field + " but was missing.");
};

exports.file_error = function(err){
    return exports.make_error("file_error", JSON.stringify(err));
};