function setup_jplayer() {
    $("#jquery_jplayer").jPlayer({
	  ready: function () {
        // this.setFile(mp3_url);
	  },
	  customCssIds: true
	});
	
	$("#pause").hide();
	
	window.global_lp = 0;
	window.callbacks = [];
	
	// setup the buttons
    $("#play").click(function() {
    	$("#jquery_jplayer").jPlayer("play");
    	showPauseBtn();
    	return false;
    });
    
    $("#pause").click(function() {
    	$("#jquery_jplayer").jPlayer("pause");
    	showPlayBtn();
    	return false;
    });                                           
                                                  
    $("#stop").click(function() {                 
    	$("#jquery_jplayer").jPlayer("stop");     
    	showPlayBtn();                            
    	return false;                             
    });                                           
	
    $("#jquery_jplayer").jPlayer("onProgressChange", function(lp,ppr,ppa,pt,tt) {
 		var lpInt = parseInt(lp);
 		var ppaInt = parseInt(ppa);
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
    
    $("#player_progress_ctrl_bar a").live( "click", function() {
		$("#jquery_jplayer").jPlayer("playHead", this.id.substring(3)*(100.0/window.global_lp));
		return false;
	});

	// Slider
	$('#sliderPlayback').slider({
		max: 100,
		range: 'min',
		animate: true,
		slide: function(event, ui) {
			$("#jquery_jplayer").jPlayer("playHead", ui.value*(100.0/window.global_lp));
		}
	});

	$('#sliderVolume').slider({
		value : 50,
		max: 100,
		range: 'min',
		animate: true,

		slide: function(event, ui) {
			$("#jquery_jplayer").jPlayer("volume", ui.value);
		}
	});

	$('#loaderBar').progressbar();

	//hover states on the static widgets
	$('#dialog_link, ul#icons li').hover(
		function() { $(this).addClass('ui-state-hover'); },
		function() { $(this).removeClass('ui-state-hover'); }
	);

}

function disable_jplayer() {
    $("#jquery_jplayer").jPlayer("stop");
    $("#jquery_jplayer").jPlayer("setFile", null);
    $("#play").addClass("ui-state-disabled");
    $("#stop").addClass("ui-state-disabled");
    $("#sliderPlayback").addClass("ui-state-disabled");
}

function enable_jplayer() {
    $("#play").removeClass("ui-state-disabled");
    $("#stop").removeClass("ui-state-disabled");
    $("#sliderPlayback").removeClass("ui-state-disabled");
}

function playTrack(t,n) {
	$("#jquery_jplayer").jPlayer("setFile", t).jPlayer("play");
    // showPauseBtn();
	return false;
}
