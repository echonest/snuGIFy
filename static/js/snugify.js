function setup_jplayer() {
    $("#jquery_jplayer").jPlayer({
      ready: function () {
      },
      customCssIds: true,
      swfPath:"/static/Jplayer.swf",
      loop:true,
      ended: function() { // The $.jPlayer.event.ended event
        $(this).jPlayer("play"); // Repeat the media
      },
    });
    
    // //looplooplooplooploop
    // $("#jquery_jplayer").jPlayer("onSoundComplete", function() { 
    //         $(this).play(); 
    // });
    
    window.global_lp = 0;
    window.callbacks = [];

    $("#jquery_jplayer").jPlayer("onProgressChange", function(lp,ppr,ppa,pt,tt) {
        var lpInt = parseInt(lp);
        var ppaInt = parseInt(ppa);
        console.log("lpInt"+lpInt);
        console.log("ppaInt"+ppaInt);
        window.global_lp = lpInt;
        window.timestamp = pt/1000;

        $('#loaderBar').progressbar('option', 'value', lpInt);
        $('#sliderPlayback').slider('value', ppaInt);
                
        if (window.current_track) {
            for (var i = 0; i<window.callbacks.length; i++) {
                window.callbacks[i](pt/1000);
            }
        }
    });

}

function disable_jplayer() {
    $("#jquery_jplayer").jPlayer("stop");
    $("#jquery_jplayer").jPlayer("setFile", null);
}

function playTrack(track_path) {
    $("#jquery_jplayer").jPlayer("setMedia", {mp3: track_path}).jPlayer("play");
    return false;
}
