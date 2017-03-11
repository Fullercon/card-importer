/*$(function{...}) is essentially the same as $(document).ready(function(){...}) in jQuery, just shorter.
 This function is therefore called after all other resources, i.e. jQuery and Mustache are loaded.*/

$(function(){
    var template, //main template html
        templateData = {}; //JSON data object that 'feeds' the template
    console.log('Loading home template');
    //Initialise the page
    var initPage = function(){

        //Load the html template
        $.get("/templates/sets.html", function(data){
            template = data;
        });

        //Retrieve the server data and then initialise the page
        $.getJSON("/v1/sets.json", function(d){
            $.extend(templateData, d.data);
        });

		/*After all AJAX calls have finished, parse the template
		 replacing mustache tags with vars*/
        $(document).ajaxStop(function(){
            var renderedPage = Mustache.to_html(template, templateData);
            $("body").html(renderedPage);
        });
    }();
});