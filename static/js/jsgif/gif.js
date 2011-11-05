//var bookmarklet = function() {
var bookmarklet = function() {

 // INSERT_GIF_JS_HERE

  var playGIF = function(gif) {
    var stream;
    var hdr;

    var loadError = null;

    var transparency = null;
    var delay = null;
    var disposalMethod = null;
    var lastDisposalMethod = null;
    var frame = null;

    var playing = true;
    var forward = true;

    var frames = [];

    var clear = function() {
      transparency = null;
      delay = null;
      lastDisposalMethod = disposalMethod;
      disposalMethod = null;
      frame = null;
      //frame = tmpCanvas.getContext('2d');
    };

    // XXX: There's probably a better way to handle catching exceptions when
    // callbacks are involved.
    var doParse = function() {
        try {
          parseGIF(stream, handler);
        } catch(err) {
          doLoadError('parse');
        }
    };

    var doGet = function() {
      var h = new XMLHttpRequest();
      h.overrideMimeType('text/plain; charset=x-user-defined');
      h.onload = function(e) {
        //doLoadProgress(e);
        // TODO: In IE, might be able to use h.responseBody instead of overrideMimeType.
        stream = new Stream(h.responseText);
        setTimeout(doParse, 0);
      };
      h.onprogress = doLoadProgress;
      h.onerror = function() { doLoadError('xhr'); };
      h.open('GET', gif.src, true);
      h.send();
    };

    var doText = function(text) {
      toolbar.innerHTML = text; // innerText? Escaping? Whatever.
      //ctx.fillStyle = 'black';
      //ctx.font = '32px sans-serif';
      //ctx.fillText(text, 8, 32);
    };

    var doShowProgress = function(prefix, pos, length, draw) {
      //toolbar.style.display = pos === length ? 'none' : 'block';
      //toolbar.style.display = pos === length ? '' : 'block'; // FIXME Move this to doPlay() or something.
      toolbar.style.visibility = pos === length ? '' : 'visible'; // FIXME Move this to doPlay() or something.

      if (draw) {
        var height = Math.min(canvas.height >> 3, canvas.height);
        var top = (canvas.height - height) >> 1;
        var bottom = (canvas.height + height) >> 1;
        var mid = (pos / length) * canvas.width;

        // XXX Figure out alpha fillRect.
        //ctx.fillStyle = 'salmon';
        ctx.fillStyle = 'rgba(255,160,122,0.5)';
        ctx.fillRect(mid, top, canvas.width - mid, height);

        //ctx.fillStyle = 'teal';
        ctx.fillStyle = 'rgba(0,128,128,0.5)';
        ctx.fillRect(0, top, (pos / length) * canvas.width, height);
      }

      doText(prefix + ' ' + Math.floor(pos / length * 100) + '%');
    };

    var doLoadProgress = function(e) {
      // TODO: Find out what lengthComputable actually means.
      if (e.lengthComputable) doShowProgress('Loading...', e.loaded, e.total, true);
    };

    var doLoadError = function(originOfError) {
      var drawError = function() {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, hdr.width, hdr.height);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 3;
        ctx.moveTo(0, 0);
        ctx.lineTo(hdr.width, hdr.height);
        ctx.moveTo(0, hdr.height);
        ctx.lineTo(hdr.width, 0);
        ctx.stroke();
      };

      loadError = originOfError;
      hdr = {width: gif.width, height: gif.height}; // Fake header.
      frames = [];
      drawError();
      setTimeout(doPlay, 0);
    };

    var doHdr = function(_hdr) {
      hdr = _hdr;
      //console.assert(gif.width === hdr.width && gif.height === hdr.height); // See other TODO.

      canvas.width = hdr.width;
      canvas.height = hdr.height;
      div.style.width = hdr.width + 'px';
      //div.style.height = hdr.height + 'px';
      toolbar.style.minWidth = hdr.width + 'px';

      tmpCanvas.width = hdr.width;
      tmpCanvas.height = hdr.height;
      //if (hdr.gctFlag) { // Fill background.
      //  rgb = hdr.gct[hdr.bgColor];
      //  tmpCanvas.fillStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',');
      //}
      //tmpCanvas.getContext('2d').fillRect(0, 0, hdr.width, hdr.height);
      // TODO: Figure out the disposal method business.
    };

    var doGCE = function(gce) {
      pushFrame();
      clear();
      transparency = gce.transparencyGiven ? gce.transparencyIndex : null;
      delay = gce.delayTime;
      disposalMethod = gce.disposalMethod;
      // We don't have much to do with the rest of GCE.
    };

    var pushFrame = function() {
      if (!frame) return;
      frames.push({data: frame.getImageData(0, 0, hdr.width, hdr.height),
                   delay: delay});
    };

    var doImg = function(img) {
      if (!frame) frame = tmpCanvas.getContext('2d');
      var ct = img.lctFlag ? img.lct : hdr.gct; // TODO: What if neither exists?

      var cData = frame.getImageData(img.leftPos, img.topPos, img.width, img.height);

      img.pixels.forEach(function(pixel, i) {
        // cData.data === [R,G,B,A,...]
        if (transparency !== pixel) { // This includes null, if no transparency was defined.
          cData.data[i * 4 + 0] = ct[pixel][0];
          cData.data[i * 4 + 1] = ct[pixel][1];
          cData.data[i * 4 + 2] = ct[pixel][2];
          cData.data[i * 4 + 3] = 255; // Opaque.
        } else {
          // TODO: Handle disposal method properly.
          // XXX: When I get to an Internet connection, check which disposal method is which.
          if (lastDisposalMethod === 2 || lastDisposalMethod === 3) {
            cData.data[i * 4 + 3] = 0; // Transparent.
            // XXX: This is very very wrong.
          } else {
            // lastDisposalMethod should be null (no GCE), 0, or 1; leave the pixel as it is.
            // assert(lastDispsalMethod === null || lastDispsalMethod === 0 || lastDispsalMethod === 1);
            // XXX: If this is the first frame (and we *do* have a GCE),
            // lastDispsalMethod will be null, but we want to set undefined
            // pixels to the background color.
          }
        }
      });
      frame.putImageData(cData, img.leftPos, img.topPos);
      // We could use the on-page canvas directly, except that we draw a progress
      // bar for each image chunk (not just the final image).
      ctx.putImageData(cData, img.leftPos, img.topPos);
    };

    var doPlay = (function() {
        var i = -1;
        var curFrame;  // XXX These two are <input> tags. They're declared up here
                       // instead of in initToolbar's scope so that stepFrame has
                       // access to them. This is hacky and should be eliminated.
                       // (Maybe this should actually be a class instead of a
                       // cheap plastic imitation? At the very least it should be
                       // abstracted more.)
        var delayInfo;


        var showingInfo = false;
        var pinned = false;

        var stepFrame = function(delta) { // XXX: Name is confusing.
          i = (i + delta + frames.length) % frames.length;
          curFrame.value = i + 1;
          delayInfo.value = frames[i].delay;
          putFrame();
        };

        var step = (function() {
          var stepping = false;

          var doStep = function() {
            stepping = playing;
            if (!stepping) return;

            stepFrame(forward ? 1 : -1);
            var delay = frames[i].delay * 10;
            if (!delay) delay = 100; // FIXME: Should this even default at all? What should it be?
            setTimeout(doStep, delay);
          };

          return function() { if (!stepping) setTimeout(doStep, 0); };
        }());

        var putFrame = function() {
          ctx.putImageData(frames[i].data, 0, 0);
        };

        var initToolbar = function() {
          // Characters.
          var right = '&#9654;';
          var left = '&#9664;';
          var bar = '&#10073;';
          var rarr = '&rarr;';
          var larr = '&larr;';
          var xsign = '&#10006;';
          //var infosource = '&#8505;';
          var circle = '&#9675;';
          var circledot = '&#8857;';
          //var blackSquare = '&#9632;'; // XXX
          //var doubleVerticalLine = '&#8214;'; // XXX
          var nearr = '&nearr;';
          // Buttons.
          var playIcon = right;
          var pauseIcon = bar + bar;
          var revplayIcon = left;
          var prevIcon = left + bar;
          var nextIcon = bar + right;
          //var showInfoIcon = infosource;
          var showInfoIcon = 'i'; // Fonts.
          var revIcon = larr;
          var revrevIcon = rarr;
          var closeIcon = xsign;
          var pinIcon = circledot;
          var unpinIcon = circle;
          var popupIcon = nearr;

          /**
           * @param{Object=} attrs Attributes (optional).
           */ // Make compiler happy.
          var elt = function(tag, cls, attrs) {
            var e = document.createElement(tag);
            if (cls) e.className = 'jsgif_' + cls;
            for (var k in attrs) {
              e[k] = attrs[k];
            }
            return e;
          };

          var simpleTools = elt('div', 'simple_tools');
          var rev = elt('button', 'rev');
          var showInfo = elt('button', 'show_info');
          var prev = elt('button', 'prev');
          var playPause = elt('button', 'play_pause');
          var next = elt('button', 'next');
          var pin = elt('button', 'pin');
          var close = elt('button', 'close');

          var infoTools = elt('div', 'info_tools');
          curFrame = elt('input', 'cur_frame', {type: 'text'}); // See above.
          delayInfo = elt('input', 'delay_info', {type: 'text'}); // See above.

          var updateTools = function() {
            if (playing) {
              playPause.innerHTML = pauseIcon;
                playPause.title = 'Pause'
              prev.style.visibility = 'hidden'; // See TODO.
              next.style.visibility = 'hidden';
            } else {
              playPause.innerHTML = forward ? playIcon : revplayIcon;
                playPause.title = 'Play';
              prev.style.visibility = '';
              next.style.visibility = '';
            }

            toolbar.style.visibility = pinned ? 'visible' : ''; // See TODO.

            infoTools.style.display = showingInfo ? '' : 'none'; // See TODO.

            showInfo.innerHTML = showInfoIcon;
              showInfo.title = 'Show info/more tools'
            rev.innerHTML = forward ? revIcon : revrevIcon;
              rev.title = forward ? 'Reverse' : 'Un-reverse';
            prev.innerHTML = prevIcon;
              prev.title = 'Previous frame';
            next.innerHTML = nextIcon;
              next.title = 'Next frame'
            pin.innerHTML = pinned ? unpinIcon : pinIcon;
              pin.title = pinned ? 'Unpin' : 'Pin';
            close.innerHTML = closeIcon;
              close.title = 'Close jsgif and go back to original image';

            curFrame.disabled = playing;
            delayInfo.disabled = playing;

            toolbar.innerHTML = '';
            simpleTools.innerHTML = '';
            infoTools.innerHTML = '';

            var t = function(text) { return document.createTextNode(text); };

            if (frames.length < 2) { // XXX
              // Also, this shouldn't actually be playing in this case.
              // TODO: Are we going to want an info tool that'll be displayed on static GIFs later?

              if (loadError == 'xhr') {
                toolbar.appendChild(t("Load failed; cross-domain? "));

                var popup = elt('button', 'popup');
                popup.addEventListener('click', function() { window.open(gif.src); } );
                popup.innerHTML = popupIcon;
                  popup.title = 'Click to open GIF in new window; try running jsgif there instead';
                toolbar.appendChild(popup);
              } else if (loadError == 'parse') {
                toolbar.appendChild(t("Parse failed "));
              }

              toolbar.appendChild(close);

              return;
            }

            // We don't actually need to repack all of these -- that's left over
            // from before -- but it doesn't especially hurt either.
            var populate = function(elt, children) {
              elt.innerHTML = '';
              children.forEach(function(c) { elt.appendChild(c); });
              //children.forEach(elt.appendChild); // Is this a "pseudo-function"?
            };

            // XXX Blach.
            var simpleToolList = forward ? [showInfo, rev, prev, playPause, next, pin, close]
                                         : [showInfo, rev, next, playPause, prev, pin, close];
            populate(toolbar, [simpleTools, infoTools]);
            populate(simpleTools, simpleToolList);
            populate(infoTools, [t(' frame: '), curFrame, t(' / '), t(frames.length), t(' (delay: '), delayInfo, t(')')]);
          };

          var doRev = function() {
            forward = !forward;
            updateTools();
            rev.focus(); // (because repack)
          };

          var doNextFrame = function() { stepFrame(1); };
          var doPrevFrame = function() { stepFrame(-1); };

          var doPlayPause = function() {
            playing = !playing;
            updateTools();
            playPause.focus(); // In case this was called by clicking on the
                               // canvas (we have to do this here because we
                               // repack the buttons).
            step();
          };

          var doCurFrameChanged = function() {
            var newFrame = +curFrame.value;
            if (isNaN(newFrame) || newFrame < 1 || newFrame > frames.length) {
              // Invalid frame; put it back to what it was.
              curFrame.value = i + 1;
            } else {
              i = newFrame - 1;
              putFrame();
            }
          };

          var doCurDelayChanged = function() {
            var newDelay = +delayInfo.value;
            if (!isNaN(newDelay)) {
              frames[i].delay = newDelay;
            }
          };

          var doToggleShowingInfo = function() {
            showingInfo = !showingInfo;
            updateTools();
            showInfo.focus(); // (because repack)
          };

          var doTogglePinned = function() {
            pinned = !pinned;
            updateTools();
            pin.focus(); // (because repack)
          };

          // TODO: If the <img> was in an <a>, every one of these will go to the
          // URL. We don't want that for the buttons (and probably not for
          // anything?).
          showInfo.addEventListener('click', doToggleShowingInfo, false);
          rev.addEventListener('click', doRev, false);
          curFrame.addEventListener('change', doCurFrameChanged, false);
          prev.addEventListener('click', doPrevFrame, false);
          playPause.addEventListener('click', doPlayPause, false);
          next.addEventListener('click', doNextFrame, false);
          pin.addEventListener('click', doTogglePinned, false);
          close.addEventListener('click', doClose, false);

          delayInfo.addEventListener('change', doCurDelayChanged, false);

          canvas.addEventListener('click', doPlayPause, false);

          // For now, to handle GIFs in <a> tags and so on. This needs to be handled better, though.
          div.addEventListener('click', function(e) { e.preventDefault(); }, false);

          updateTools();
        };

        return function() {
          setTimeout(initToolbar, 0);
          if (loadError) return;
          canvas.width = hdr.width;
          canvas.height = hdr.height;
          step();
        };
    }());

    var doClose = function() {
      playing = false;
      parent.insertBefore(gif, div);
      parent.removeChild(div);
    };

    var doDecodeProgress = function(draw) {
      doShowProgress('Decoding (frame ' + (frames.length + 1) + ')...', stream.pos, stream.data.length, draw);
    };

    var doNothing = function(){};
    /**
     * @param{boolean=} draw Whether to draw progress bar or not; this is not idempotent because of translucency.
     *                       Note that this means that the text will be unsynchronized with the progress bar on non-frames;
     *                       but those are typically so small (GCE etc.) that it doesn't really matter. TODO: Do this properly.
     */
    var withProgress = function(fn, draw) {
      return function(block) {
        fn(block);
        doDecodeProgress(draw);
      };
    };


    var handler = {
      hdr: withProgress(doHdr),
      gce: withProgress(doGCE),
      com: withProgress(doNothing), // I guess that's all for now.
      app: {
       // TODO: Is there much point in actually supporting iterations?
        NETSCAPE: withProgress(doNothing)
      },
      img: withProgress(doImg, true),
      eof: function(block) {
        //toolbar.style.display = '';
        pushFrame();
        doDecodeProgress(false);
        doText('Playing...');
        doPlay();
      }
    };

    var parent = gif.parentNode;

    var div = document.createElement('div');
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var toolbar = document.createElement('div');

    var tmpCanvas = document.createElement('canvas');

    // Copy the computed style of the <img> to the <div>. The CSS specifies
    // !important for all its properties; this still has a few issues, but it's
    // probably preferable to not doing it. XXX: Maybe this should only copy a
    // few specific properties (or specify properties more thoroughly in the
    // CSS)?
    // (If we don't hav getComputedStyle we'll have to get along without it, of
    // course. It's not as if this supports IE, anyway, though, so I don't know
    // if that really matters.)
    //
    // XXX: Commented out for now. If uncommenting, make sure to add !important
    // to all the CSS properties in jsgif.css
    //
    //if (window.getComputedStyle) {
    //  for (var s in window.getComputedStyle(gif)) {
    //    div.style[s] = gif.style[s];
    //  }
    //}

    // This is our first estimate for the size of the picture. It might have been
    // changed so we'll correct it when we parse the header. TODO: Handle zoom etc.
    canvas.width = gif.width;
    canvas.height = gif.height;
    toolbar.style.minWidth = gif.width + 'px';

    div.className = 'jsgif';
    toolbar.className = 'jsgif_toolbar';
    div.appendChild(canvas);
    div.appendChild(toolbar);

    parent.insertBefore(div, gif);
    parent.removeChild(gif);

    doText('Loading...');
    doGet();
  };

  var bookmarkletCSS = '/* INSERT_CSS_HERE */';

  var insertCSS = function(css) { // Surely there's a much better way of handling this whole thing.
    // XXX: If there isn't a better way of handling this: Should we remove the <style> tag when the bookmarklet is done?
    var style = document.createElement('style');
    style.type = 'text/css';
    style.textContent = css; // See TODO.
    document.body.appendChild(style);
  };

  var to_a = function(pseudoList) { // Blagh, delicious DOM. I'll do this for now.
    var a = [];
    for (var i = 0; i < pseudoList.length; i++) {
      a.push(pseudoList[i]);
    }
    return a;
  };

  // There *has* to be a better way of doing this. This is just... Temporary. That's right, temporary.
  var join = function(strings, between) {
    if (between === undefined) between = '';
    return strings.reduce(function(s, n) { return s + between + n; }, '');
  };
  var elemClasses = function(elem) {
    return elem.className.split(/\s/);
  };
  var addClass = function(elem, cls) {
    elem.className += ' ' + cls;
  };
  var removeClass = function(elem, cls) {
    var classes = elemClasses(elem).filter(function(_cls) { return _cls !== cls; });
    elem.className = join(classes, ' ');
  };

  var imgs = to_a(document.getElementsByTagName('img'));
  var gifs = imgs.filter(function(img) {
    return img.src.slice(-4).toLowerCase() === '.gif';
    // This is a very cheap plastic imitation of checking the MIME type -- I've
    // seen GIFs with no extension (or, even worse, ending in .jpg). I can't
    // see a good way of figuring out if an image is a GIF, though, so this
    // will have TODO for now.
  });
  // Partial workaround: If there were no .gif images, we'll just try all the <img> tags.
  if (gifs.length === 0) gifs = imgs;

  var clicked = function(e) {
    var gif = this; // eventListener context
    gifs.forEach(rmOverlay);
    setTimeout(function() { playGIF(gif); }, 0);
    e.preventDefault();
  };

  var mkOverlay = function(gif) {
    if (elemClasses(gif).indexOf('jsgif_overlaid') !== -1) return; // Idempotent.
    addClass(gif, 'jsgif_overlaid');
    gif.addEventListener('click', clicked, false);
  };

  var rmOverlay = function(gif) {
    // XXX: What if the bookmarklet was run more than once?
    removeClass(gif, 'jsgif_overlaid');
    gif.removeEventListener('click', clicked, false);
  };


  insertCSS(bookmarkletCSS);


  gifs.forEach(mkOverlay);
};

// So here we take advantage of the fact that we didn't tell Closure that we're
// exporting this function, which means we can do "var b = ...; b();" and it'll
// handle it correctly.
// This used to be even more convoluted.













// Generic functions
var bitsToNum = function(ba) {
  return ba.reduce(function(s, n) { return s * 2 + n; }, 0);
};

var byteToBitArr = function(bite) {
  var a = [];
  for (var i = 7; i >= 0; i--) {
    a.push(!!(bite & (1 << i)));
  }
  return a;
};

// Stream
/**
 * @constructor
 */ // Make compiler happy.
var Stream = function(data) {
  this.data = data;
  this.len = this.data.length;
  this.pos = 0;

  this.readByte = function() {
    if (this.pos >= this.data.length) {
      throw new Error('Attempted to read past end of stream.');
    }
    return data.charCodeAt(this.pos++) & 0xFF;
  };

  this.readBytes = function(n) {
    var bytes = [];
    for (var i = 0; i < n; i++) {
      bytes.push(this.readByte());
    }
    return bytes;
  };

  this.read = function(n) {
    var s = '';
    for (var i = 0; i < n; i++) {
      s += String.fromCharCode(this.readByte());
    }
    return s;
  };

  this.readUnsigned = function() { // Little-endian.
    var a = this.readBytes(2);
    return (a[1] << 8) + a[0];
  };
};

var lzwDecode = function(minCodeSize, data) {
  // TODO: Now that the GIF parser is a bit different, maybe this should get an array of bytes instead of a String?
  var pos = 0; // Maybe this streaming thing should be merged with the Stream?

  var readCode = function(size) {
    var code = 0;
    for (var i = 0; i < size; i++) {
      if (data.charCodeAt(pos >> 3) & (1 << (pos & 7))) {
        code |= 1 << i;
      }
      pos++;
    }
    return code;
  };

  var output = [];

  var clearCode = 1 << minCodeSize;
  var eoiCode = clearCode + 1;

  var codeSize = minCodeSize + 1;

  var dict = [];

  var clear = function() {
    dict = [];
    codeSize = minCodeSize + 1;
    for (var i = 0; i < clearCode; i++) {
      dict[i] = [i];
    }
    dict[clearCode] = [];
    dict[eoiCode] = null;

  };

  var code;
  var last;

  while (true) {
    last = code;
    code = readCode(codeSize);

    if (code === clearCode) {
      clear();
      continue;
    }
    if (code === eoiCode) break;

    if (code < dict.length) {
      if (last !== clearCode) {
        dict.push(dict[last].concat(dict[code][0]));
      }
    } else {
      if (code !== dict.length) throw new Error('Invalid LZW code.');
      dict.push(dict[last].concat(dict[last][0]));
    }
    output.push.apply(output, dict[code]);

    if (dict.length === (1 << codeSize) && codeSize < 12) {
      // If we're at the last code and codeSize is 12, the next code will be a clearCode, and it'll be 12 bits long.
      codeSize++;
    }
  }

  // I don't know if this is technically an error, but some GIFs do it.
  //if (Math.ceil(pos / 8) !== data.length) throw new Error('Extraneous LZW bytes.');
  return output;
};

// The actual parsing; returns an object with properties.
var parseGIF = function(st, handler) {
  handler || (handler = {});

  // LZW (GIF-specific)
  var parseCT = function(entries) { // Each entry is 3 bytes, for RGB.
    var ct = [];
    for (var i = 0; i < entries; i++) {
      ct.push(st.readBytes(3));
    }
    return ct;
  };

  var readSubBlocks = function() {
      var size, data;
      data = '';
      do {
        size = st.readByte();
        data += st.read(size);
      } while (size !== 0);
      return data;
  };

  var parseHeader = function() {
    var hdr = {};
    hdr.sig = st.read(3);
    hdr.ver = st.read(3);
    if (hdr.sig !== 'GIF') throw new Error('Not a GIF file.'); // XXX: This should probably be handled more nicely.

    hdr.width = st.readUnsigned();
    hdr.height = st.readUnsigned();

    var bits = byteToBitArr(st.readByte());
    hdr.gctFlag = bits.shift();
    hdr.colorRes = bitsToNum(bits.splice(0, 3));
    hdr.sorted = bits.shift();
    hdr.gctSize = bitsToNum(bits.splice(0, 3));

    hdr.bgColor = st.readByte();
    hdr.pixelAspectRatio = st.readByte(); // if not 0, aspectRatio = (pixelAspectRatio + 15) / 64

    if (hdr.gctFlag) {
      hdr.gct = parseCT(1 << (hdr.gctSize + 1));
    }
    handler.hdr && handler.hdr(hdr);
  };

  var parseExt = function(block) {
    var parseGCExt = function(block) {
      var blockSize = st.readByte(); // Always 4

      var bits = byteToBitArr(st.readByte());
      block.reserved = bits.splice(0, 3); // Reserved; should be 000.
      block.disposalMethod = bitsToNum(bits.splice(0, 3));
      block.userInput = bits.shift();
      block.transparencyGiven = bits.shift();

      block.delayTime = st.readUnsigned();

      block.transparencyIndex = st.readByte();

      block.terminator = st.readByte();

      handler.gce && handler.gce(block);
    };

    var parseComExt = function(block) {
      block.comment = readSubBlocks();
      handler.com && handler.com(block);
    };

    var parsePTExt = function(block) {
      // No one *ever* uses this. If you use it, deal with parsing it yourself.
      var blockSize = st.readByte(); // Always 12
      block.ptHeader = st.readBytes(12);
      block.ptData = readSubBlocks();
      handler.pte && handler.pte(block);
    };

    var parseAppExt = function(block) {
      var parseNetscapeExt = function(block) {
        var blockSize = st.readByte(); // Always 3
        block.unknown = st.readByte(); // ??? Always 1? What is this?
        block.iterations = st.readUnsigned();
        block.terminator = st.readByte();
        handler.app && handler.app.NETSCAPE && handler.app.NETSCAPE(block);
      };

      var parseUnknownAppExt = function(block) {
          block.appData = readSubBlocks();
          // FIXME: This won't work if a handler wants to match on any identifier.
          handler.app && handler.app[block.identifier] && handler.app[block.identifier](block);
      };

      var blockSize = st.readByte(); // Always 11
      block.identifier = st.read(8);
      block.authCode = st.read(3);
      switch (block.identifier) {
        case 'NETSCAPE':
          parseNetscapeExt(block);
          break;
        default:
          parseUnknownAppExt(block);
          break;
      }
    };

    var parseUnknownExt = function(block) {
        block.data = readSubBlocks();
        handler.unknown && handler.unknown(block);
    };

    block.label = st.readByte();
    switch (block.label) {
      case 0xF9:
        block.extType = 'gce';
        parseGCExt(block);
        break;
      case 0xFE:
        block.extType = 'com';
        parseComExt(block);
        break;
      case 0x01:
        block.extType = 'pte';
        parsePTExt(block);
        break;
      case 0xFF:
        block.extType = 'app';
        parseAppExt(block);
        break;
      default:
        block.extType = 'unknown';
        parseUnknownExt(block);
        break;
    }
  };

  var parseImg = function(img) {
    var deinterlace = function(pixels, width) {
      // Of course this defeats the purpose of interlacing. And it's *probably*
      // the least efficient way it's ever been implemented. But nevertheless...

      var newPixels = new Array(pixels.length);
      var rows = pixels.length / width;
      var cpRow = function(toRow, fromRow) {
        var fromPixels = pixels.slice(fromRow * width, (fromRow + 1) * width);
        newPixels.splice.apply(newPixels, [toRow * width, width].concat(fromPixels));
      };

      // See appendix E.
      var offsets = [0,4,2,1];
      var steps   = [8,8,4,2];

      var fromRow = 0;
      for (var pass = 0; pass < 4; pass++) {
        for (var toRow = offsets[pass]; toRow < rows; toRow += steps[pass]) {
          cpRow(toRow, fromRow)
          fromRow++;
        }
      }

      return newPixels;
    };

    img.leftPos = st.readUnsigned();
    img.topPos = st.readUnsigned();
    img.width = st.readUnsigned();
    img.height = st.readUnsigned();

    var bits = byteToBitArr(st.readByte());
    img.lctFlag = bits.shift();
    img.interlaced = bits.shift();
    img.sorted = bits.shift();
    img.reserved = bits.splice(0, 2);
    img.lctSize = bitsToNum(bits.splice(0, 3));

    if (img.lctFlag) {
      img.lct = parseCT(1 << (img.lctSize + 1));
    }

    img.lzwMinCodeSize = st.readByte();

    var lzwData = readSubBlocks();

    img.pixels = lzwDecode(img.lzwMinCodeSize, lzwData);

    if (img.interlaced) { // Move
      img.pixels = deinterlace(img.pixels, img.width);
    }

    handler.img && handler.img(img);
  };

  var parseBlock = function() {
    var block = {};
    block.sentinel = st.readByte();

    switch (String.fromCharCode(block.sentinel)) { // For ease of matching
      case '!':
        block.type = 'ext';
        parseExt(block);
        break;
      case ',':
        block.type = 'img';
        parseImg(block);
        break;
      case ';':
        block.type = 'eof';
        handler.eof && handler.eof(block);
        break;
      default:
        throw new Error('Unknown block: 0x' + block.sentinel.toString(16)); // TODO: Pad this with a 0.
    }

    if (block.type !== 'eof') setTimeout(parseBlock, 0);
  };

  var parse = function() {
    parseHeader();
    setTimeout(parseBlock, 0);
  };

  parse();
};

// BEGIN_NON_BOOKMARKLET_CODE
if (typeof exports !== 'undefined') {
  exports.Stream = Stream;
  exports.parseGIF = parseGIF;
}
// END_NON_BOOKMARKLET_CODE
