var helpers = require('./helpers.js'),
    fs = require('fs');

exports.version = "0.1.0";

exports.generate = function (request, response) {
    console.log(request.params);

    var page = get_page_name(request);
    var subPage = getSubPageName(request);

    console.log('Attempting to serve '+ page +' page ' + subPage);

    //Read file reads entire contents of a file into a buffer, which needs to then be converted into a string
    fs.readFile(
        'basic.html',
        function(err, contents){
            if(err){
                helpers.send_failure(response, 500, err);
                return;
            }
            //Not recommended if contents is large as memory hungry, but fine in this case
            contents = contents.toString('utf8');
            //Replace page name, then dump to output (response.end)
            contents = contents.replace('{{PAGE_NAME}}', page);
            response.writeHead(200, {"Content-Type": "text/html"});
            response.end(contents);
        });
};


function get_page_name(req) {
    return req.params.page_name;
}

function getSubPageName(req) {
    return req.params.sub_page;
}