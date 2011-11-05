$.extend({
    keys:	 function(obj){
        var a = [];
        $.each(obj, function(k){ a.push(k); });
        return a;
    }
});

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
    updateSongInfo(songObj.artist, songObj.title);
    loopFile(songObj.loop_url);
}

function ohShit(e) {
    console.log(e);
}

function searchLoadSong(user_input) {
    clear_container("songInfo");
    // looks like this:
    // http://snuggle.sandpit.us/looper?combined=kreayshawn%20gucci%20gucci
    $.ajax({url: "/looper", data: {combined : user_input, bars_count: 4}, dataType: 'JSON', success: injectSong, error:ohShit});
    return false;
}