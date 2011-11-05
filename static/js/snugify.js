function setupSM() {
    soundManager.url = '/static/';
    soundManager.flashVersion = 9; // optional: shiny features (default = 8)
    soundManager.useFlashBlock = false; // optionally, enable when you're ready to dive in
    soundManager.onready(function() {
        window.sm_loaded = true;
      // Ready to use; soundManager.createSound() etc. can now be called.
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