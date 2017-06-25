/**
 * Created by Jack on 17/06/2017.
 */
$(function(){
    var template, //main template html
        templateData = {}; //JSON data object that 'feeds' the template
    console.log('Loading set page template');

    // Initialise the page
    var initPage = function(){
        var urlParts = window.location.href.split('/');
        console.log('url parts: ' + urlParts[5]);
        var setName = urlParts[5];

        // Load the html template
        $.get("/templates/set.html", function(data){
            template = data;
        });
        console.log('/v1/set/' + setName + '.json');
        // Retrieve the server data and then initialise the page
        $.getJSON("/v1/set/" + setName + ".json", function(d){
            $.extend(templateData, d.data);
            console.log(JSON.parse(JSON.stringify(d.data)))
        });

         // After all AJAX calls have finished, parse the template
         // replacing mustache tags with vars
        $(document).ajaxStop(function(){
            var renderedPage = Mustache.to_html(template, templateData);
            $("body").html(renderedPage);
        });
    }();
});