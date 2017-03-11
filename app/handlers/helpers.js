exports.version = '0.1.0';

exports.make_error = function(err, msg){
    var e = new Error(msg);
    e.code = err;
    return e;
};

exports.send_success = function(response, data){
    var output = {error: null, data:data};
    response.writeHead(200, {"Content-Type" : "application/json"});
    response.end(JSON.stringify(output) + "\n");
};

exports.send_failure = function(response, code, err){
    var code = code ? code : err.code;
    response.writeHead(code, {"Content-Type" : "application/json"});
    response.end(JSON.stringify({error: code, message: err.message}) + "\n");
};

exports.invalid_resource = function() {
    return exports.make_error("invalid_resource", "the requested resource does not exist.");
};

exports.bad_json = function(){
    return exports.make_error("bad_json", "the data is not in a valid JSON format");
};

exports.missing_data = function(data_field){
    return exports.make_error("missing_data", "Expected " + data_field + " but was missing.");
};

exports.file_error = function(err){
    return exports.make_error("file_error", JSON.stringify(err));
};