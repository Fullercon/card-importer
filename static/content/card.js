/*$(function{...}) is essentially the same as $(document).ready(function(){...}) in jQuery, just shorter.
 This function is therefore called after all other resources, i.e. jQuery and Mustache are loaded.*/

$(function(){
    var template, //main template html
        templateData = {}; //JSON data object that 'feeds' the template
    console.log('Loading card template');
    //Initialise the page
    var initPage = function(){

        var urlParts = window.location.href.split('/');
        console.log('url parts: ' + urlParts[5]);
        var cardName = urlParts[5];

        //Load the html template
        $.get("/templates/card.html", function(data){
            template = data;
        });

        //Retrieve the server data and then initialise the page
        $.getJSON("/v1/card/" + cardName + ".json", function(d){
            console.log(d.data);
            $.extend(templateData, d.data);
        });

		/*After all AJAX calls have finished, parse the template
		 replacing mustache tags with vars*/
        $(document).ajaxStop(function(){
            var renderedPage = Mustache.to_html(template, templateData);
            $("body").html(renderedPage);
            $(".container").fadeIn('slow');
        });
    }();
});