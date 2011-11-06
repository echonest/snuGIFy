var cursor = 0,
    testImages = ["/static/images/1.jpg","/static/images/2.jpg"],
    prepped = [],
    prepImages = function(images){
        if(!(images instanceof Array)) images = [images]; // ensure array


    for(var i=0;i<images.length;i++){
        var img = new Image();
            img.src = images[i];
            // console.log(img.src,images[i]);
            $(".hidden").append($(img));
            prepped.push(img);
        //img.onload = function(){
            // console.log(this,"loaded");
        //};
        //console.log(testImages,prepped);
        // return prepCanvas(prepped); //start off our canvas animation
    }
};

var stepOver = function(somearr){
    var tick = somearr.length;
    cursor += 1;
    if(cursor > somearr.length) cursor = 0;
    return cursor;
};

var rNum = function(){
    return Math.floor(Math.random()*2);
};

function prepCanvas(images){
    var canvas = document.getElementById("reanimator"),
        context = canvas.getContext('2d'),
        cw = images[0].width,
        ch = images[0].height;

    console.log(cw,ch);

    $(canvas).fadeIn();
    canvas.width = cw;
    canvas.height = ch;

    return draw(context,images[0],cw,ch);

}

// function draw(canvas,image,w,h) {
//     w = (w===0) ? image.width : w;
//     h = (h===0) ? image.height : h;
//     canvas.drawImage(image,0,0,w,h);
//     // setTimeout(function(){
//     //     console.log(prepped(stepOver(prepped)),"vs",image);
//     //     draw(canvas,prepped(stepOver(prepped)),w,h);
//     // },300);
// }
/*
prepImages(testImages);
setTimeout(function () {
    prepCanvas(prepped[0]);
},300);
*/

/** DOM bits and search **/

function clear_container(container_name) {
    var elmt = document.getElementById(container_name);
    elmt.innerHTML="";
}

function setupSM() {
    soundManager.url = '/static/';
    soundManager.debugMode = false;
    soundManager.flashVersion = 9; // optional: shiny features (default = 8)
    soundManager.useFlashBlock = false; // optionally, enable when you're ready to dive in
    soundManager.onready(function() {
        window.sm_loaded = true;
    });
}

function loopFile(url) {
    if (!window.sm_loaded) {
        return false;
    }
    var s = soundManager.createSound({
      id:url,
      url:url
    });
    
    s.options.whileplaying = function() {
        displayNext(this.position/1000);
    }
    
    s.play({
      loops: 100
    });
    return true;
}

function updateSongInfo(artist, title) {
    $("#songInfo").html("<p>"+artist+"-"+title+"</p>");
}

function injectSong(data) {
    var songObj = data;
    console.log(songObj,"song obj baby");
    updateSongInfo(songObj.artist, songObj.title);
    window.songObj = songObj;
    prepImages(songObj.gifurls);
    loopFile(songObj.loop_url);
    $("#songLoader").fadeOut().remove();
}

function ohShit(e) {
    alert("some shit went wrong so search for another song innit");
    console.log(e);
    $("#songLoader").fadeOut().remove();
}

function get_index(feature_list, offset)
{
    var low = 0;
    var high = feature_list.length - 1;
    
    while (low <= high) 
    {
        var mid = parseInt((low + high) / 2);
        var midVal = feature_list[mid];
        
        if (midVal['start'] + midVal['duration'] < offset)
            low = mid + 1;
        else if (midVal['start'] > offset)
            high = mid - 1;
        else
            return mid; // key found
    }
    return -1;  // key not found.
}

function get_feature(feature_list, offset) 
{
    var i = get_index(feature_list, offset);
    if (i != -1)
        return feature_list[i];
    
    return null;
}

function displayNext(timestamp) {
    songObj = window.songObj;
    var feature = get_feature(songObj.beats, timestamp);
    // console.log("feature for "+timestamp+" is:"+JSON.stringify(feature));
    console.log("got new timestamp",timestamp);
    if (window.feature === null ) {
        $("#reanimator").fadeIn();        
    }
    if (feature != window.feature) {
        console.log("updating feature!");
        //update!
        window.feature = feature;        
        var i = stepOver(prepped);
        
        var canvas = document.getElementById("reanimator"),
            context = canvas.getContext('2d'),
            cw = prepped[i].width,
            ch = prepped[i].height;

        // console.log(cw,ch);

        // $("#reanimator").fadeIn();
        canvas.width = cw;
        canvas.height = ch;
        console.log("drawing:",prepped[i]);
        var image = new Image();
        image.src = prepped[i].src;
        context.clearRect(0,0,cw,ch);
        context.drawImage(image,0,0,cw,ch);
    }
}


function searchLoadSong(user_input) {
    clear_container("songInfo");
    var img = $("img.selected");
        source = img.attr("src");
    console.log(source);
    // looks like this:
    // http://snuggle.sandpit.us/looper?combined=kreayshawn%20gucci%20gucci
    $.ajax({
        url: "/looper", 
        data: {combined : user_input, gifurl : source}, 
        dataType: 'JSON', 
        success: injectSong, 
        error:ohShit
    });
    return false;
}

$.extend({
    keys:    function(obj){
        var a = [];
        $.each(obj, function(k){ a.push(k); });
        return a;
    }
});

/** Canvas stuff **/

window.requestAnimFrame = (function(callback){
    return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback){
        window.setTimeout(callback, 1000 / 60);
    };
})();
