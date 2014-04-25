/*======================================================*
 * BUILT VIA MEDIAELEMENT REPOSITORY - DO NOT EDIT HERE *
 *======================================================*/
glam.create.define("mediaelement", ["flash"], function(glamFlash) {// Namespace
var mejs = mejs || {};

// player number (for missing, same id attr)
mejs.meIndex = 0;

// media types accepted by plugins
mejs.plugins = {
	'flash': [
		{version: 9, types: ['video/mp4','video/m4v','video/mov','video/flv','video/rtmp','video/x-flv','audio/flv','audio/x-flv','audio/mp3','audio/m4a','audio/mpeg', 'video/youtube', 'video/x-youtube']}
	],
	'youtube': [
		{version: null, types: ['video/youtube', 'video/x-youtube', 'audio/youtube', 'audio/x-youtube']}
	]
};

var pluginBridgeUniqueFn = 'glm_mejs_bridge_' + Math.floor(Math.random() * 1e6);

/*
Utility methods
*/
mejs.Utility = {
	encodeUrl: function(url) {
		return encodeURIComponent(url); //.replace(/\?/gi,'%3F').replace(/=/gi,'%3D').replace(/&/gi,'%26');
	},
	escapeHTML: function(s) {
		return s.toString().split('&').join('&amp;').split('<').join('&lt;').split('"').join('&quot;');
	},
	absolutizeUrl: function(url) {
		var el = document.createElement('div');
		el.innerHTML = '<a href="' + this.escapeHTML(url) + '">x</a>';
		return el.firstChild.href;
	},
	secondsToTimeCode: function(time, forceHours, showFrameCount, fps) {
		//add framecount
		if (typeof showFrameCount == 'undefined') {
			showFrameCount=false;
		} else if(typeof fps == 'undefined') {
			fps = 25;
		}

		var hours = Math.floor(time / 3600) % 24,
			minutes = Math.floor(time / 60) % 60,
			seconds = Math.floor(time % 60),
			frames = Math.floor(((time % 1)*fps).toFixed(3)),
			result = ( (forceHours || hours > 0) ? (hours < 10 ? '0' + hours : hours) + ':' : '') +
				(minutes < 10 ? '0' + minutes : minutes) +
				':' +
				(seconds < 10 ? '0' + seconds : seconds) +
				((showFrameCount) ? ':' + (frames < 10 ? '0' + frames : frames) : '');

		return result;
	},

	timeCodeToSeconds: function(hh_mm_ss_ff, forceHours, showFrameCount, fps){
		if (typeof showFrameCount == 'undefined') {
			showFrameCount=false;
		} else if(typeof fps == 'undefined') {
			fps = 25;
		}

		var tc_array = hh_mm_ss_ff.split(":"),
			tc_hh = parseInt(tc_array[0], 10),
			tc_mm = parseInt(tc_array[1], 10),
			tc_ss = parseInt(tc_array[2], 10),
			tc_ff = 0,
			tc_in_seconds = 0;

		if (showFrameCount) {
			tc_ff = parseInt(tc_array[3],10)/fps;
		}

		tc_in_seconds = ( tc_hh * 3600 ) + ( tc_mm * 60 ) + tc_ss + tc_ff;

		return tc_in_seconds;
	},


	convertSMPTEtoSeconds: function (SMPTE) {
		if (typeof SMPTE != 'string')
			return false;

		SMPTE = SMPTE.replace(',', '.');

		var secs = 0,
			decimalLen = (SMPTE.indexOf('.') != -1) ? SMPTE.split('.')[1].length : 0,
			multiplier = 1;

		SMPTE = SMPTE.split(':').reverse();

		for (var i = 0; i < SMPTE.length; i++) {
			multiplier = 1;
			if (i > 0) {
				multiplier = Math.pow(60, i);
			}
			secs += Number(SMPTE[i]) * multiplier;
		}
		return Number(secs.toFixed(decimalLen));
	},

	/* borrowed from SWFObject: http://code.google.com/p/swfobject/source/browse/trunk/swfobject/src/swfobject.js#474 */
	removeSwf: function(id) {
		var obj = document.getElementById(id);
		if (obj && /object|embed/i.test(obj.nodeName)) {
			if (mejs.MediaFeatures.isIE) {
				obj.style.display = "none";
				(function this_fn(){
					if (obj.readyState == 4) {
						mejs.Utility.removeObjectInIE(id);
					} else {
						setTimeout(this_fn, 10);
					}
				})();
			} else {
				obj.parentNode.removeChild(obj);
			}
		}
	},
	removeObjectInIE: function(id) {
		var obj = document.getElementById(id);
		if (obj) {
			for (var i in obj) {
				if (typeof obj[i] == "function") {
					obj[i] = null;
				}
			}
			obj.parentNode.removeChild(obj);
		}
	}
};

// necessary detection (fixes for <IE9)
mejs.MediaFeatures = {
	init: function() {
		var
			t = this,
			d = document,
			nav = window.navigator,
			ua = nav.userAgent.toLowerCase(),
			i,
			v,
			html5Elements = ['source','track','audio','video'];

		// detect browsers (only the ones that have some kind of quirk we need to work around)
		t.isiPad = (ua.match(/ipad/i) !== null);
		t.isiPhone = (ua.match(/iphone/i) !== null);
		t.isiOS = t.isiPhone || t.isiPad;
		t.isAndroid = (ua.match(/android/i) !== null);
		t.isBustedAndroid = (ua.match(/android 2\.[12]/) !== null);
		t.isBustedNativeHTTPS = (location.protocol === 'https:' && (ua.match(/android [12]\./) !== null || ua.match(/macintosh.* version.* safari/) !== null));
		t.isIE = (nav.appName.toLowerCase().match(/trident/gi) !== null);
		t.isChrome = (ua.match(/chrome/gi) !== null);
		t.isFirefox = (ua.match(/firefox/gi) !== null);
		t.isWebkit = (ua.match(/webkit/gi) !== null);
		t.isGecko = (ua.match(/gecko/gi) !== null) && !t.isWebkit && !t.isIE;
		t.isOpera = (ua.match(/opera/gi) !== null);
		t.hasTouch = ('ontouchstart' in window); //  && window.ontouchstart != null); // this breaks iOS 7

		// borrowed from Modernizr
		t.svg = !! document.createElementNS &&
				!! document.createElementNS('http://www.w3.org/2000/svg','svg')['createSVGRect'];

		// create HTML5 media elements for IE before 9, get a <video> element for fullscreen detection
		for (i=0; i<html5Elements.length; i++) {
			v = document.createElement(html5Elements[i]);
		}

		t.supportsMediaTag = (typeof v.canPlayType !== 'undefined' || t.isBustedAndroid);

		// Fix for IE9 on Windows 7N / Windows 7KN (Media Player not installer)
		try{
			v.canPlayType("video/mp4");
		}catch(e){
			t.supportsMediaTag = false;
		}

		// detect native JavaScript fullscreen (Safari/Firefox only, Chrome still fails)

		// iOS
		t.hasSemiNativeFullScreen = (typeof v.webkitEnterFullscreen !== 'undefined');

		// W3C
		t.hasNativeFullscreen = (typeof v.requestFullscreen !== 'undefined');

		// webkit/firefox/IE11+
		t.hasWebkitNativeFullScreen = (typeof v.webkitRequestFullScreen !== 'undefined');
		t.hasMozNativeFullScreen = (typeof v.mozRequestFullScreen !== 'undefined');
		t.hasMsNativeFullScreen = (typeof v.msRequestFullscreen !== 'undefined');

		t.hasTrueNativeFullScreen = (t.hasWebkitNativeFullScreen || t.hasMozNativeFullScreen || t.hasMsNativeFullScreen);
		t.nativeFullScreenEnabled = t.hasTrueNativeFullScreen;

		// Enabled?
		if (t.hasMozNativeFullScreen) {
			t.nativeFullScreenEnabled = document.mozFullScreenEnabled;
		} else if (t.hasMsNativeFullScreen) {
			t.nativeFullScreenEnabled = document.msFullscreenEnabled;
		}

		if (t.isChrome) {
			t.hasSemiNativeFullScreen = false;
		}

		if (t.hasTrueNativeFullScreen) {

			t.fullScreenEventName = '';
			if (t.hasWebkitNativeFullScreen) {
				t.fullScreenEventName = 'webkitfullscreenchange';

			} else if (t.hasMozNativeFullScreen) {
				t.fullScreenEventName = 'mozfullscreenchange';

			} else if (t.hasMsNativeFullScreen) {
				t.fullScreenEventName = 'MSFullscreenChange';
			}

			t.isFullScreen = function() {
				if (v.mozRequestFullScreen) {
					return d.mozFullScreen;

				} else if (v.webkitRequestFullScreen) {
					return d.webkitIsFullScreen;

				} else if (v.hasMsNativeFullScreen) {
					return d.msFullscreenElement !== null;
				}
			};

			t.requestFullScreen = function(el) {

				if (t.hasWebkitNativeFullScreen) {
					el.webkitRequestFullScreen();

				} else if (t.hasMozNativeFullScreen) {
					el.mozRequestFullScreen();

				} else if (t.hasMsNativeFullScreen) {
					el.msRequestFullscreen();

				}
			};

			t.cancelFullScreen = function() {
				if (t.hasWebkitNativeFullScreen) {
					document.webkitCancelFullScreen();

				} else if (t.hasMozNativeFullScreen) {
					document.mozCancelFullScreen();

				} else if (t.hasMsNativeFullScreen) {
					document.msExitFullscreen();

				}
			};

		}


		// OS X 10.5 can't do this even if it says it can :(
		if (t.hasSemiNativeFullScreen && ua.match(/mac os x 10_5/i)) {
			t.hasNativeFullScreen = false;
			t.hasSemiNativeFullScreen = false;
		}

	}
};
mejs.MediaFeatures.init();

/*
extension methods to <video> or <audio> object to bring it into parity with PluginMediaElement (see below)
*/
mejs.HtmlMediaElement = {
	'pluginType': 'native',
	'isFullScreen': false,

	'setCurrentTime': function(time) {
		this.currentTime = time;
	},

	'setMuted': function(muted) {
		this.muted = muted;
	},

	'setVolume': function(volume) {
		this.volume = volume;
	},

	// for parity with the plugin versions
	'stop': function() {
		this.pause();
	},

	// This can be a url string
	// or an array [{src:'file.mp4',type:'video/mp4'},{src:'file.webm',type:'video/webm'}]
	'setSrc': function(url) {

		// Fix for IE9 which can't set .src when there are <source> elements. Awesome, right?
		var existingSources = this.getElementsByTagName('source');

		while (existingSources.length > 0){
			this.removeChild(existingSources[0]);
		}

		if (typeof url == 'string') {
			this.src = url;
		} else {
			var i, media;

			for (i=0; i<url.length; i++) {
				media = url[i];
				if (this.canPlayType(media.type)) {
					this.src = media.src;
					break;
				}
			}
		}
	},

	'setVideoSize': function(width, height) {
		this.width = width;
		this.height = height;
	}
};

/**
 * Mimics the <video/audio> element by calling Flash's External Interface
 * @constructor
*/
mejs.PluginMediaElement = function (pluginid, pluginType, mediaUrl) {
	this.id = pluginid;
	this['pluginType'] = pluginType;
	this.isYouTube = pluginType == 'youtube';
	this.events = {};
	this.attributes = {};
	this.pluginElement = null;

	this.src = mediaUrl;

	// HTML5 read-only properties
	this['paused'] = true;
	this['ended'] = false;
	this['seeking'] = false;
	this['duration'] = 0;
	this['error'] = null;
	this['tagName'] = '';

	// HTML5 get/set properties, but only set (updated by event handlers)
	this['muted'] = false;
	this['volume'] = 1;
	this['currentTime'] = 0;

	// not implemented :(
	this['playbackRate'] = -1;
	this['defaultPlaybackRate'] = -1;
	this['seekable'] = [];
	this['played'] = [];
	this['isFullScreen'] = false; //?
};

// JavaScript values and ExternalInterface methods that match HTML5 video properties methods
// http://www.adobe.com/livedocs/flash/9.0/ActionScriptLangRefV3/fl/video/FLVPlayback.html
// http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html
mejs.PluginMediaElement.prototype = {
	// HTML5 methods
	play: function() {
		if (this.pluginApi) {
			if (this.isYouTube) {
				this.pluginApi['playVideo']();
			} else {
				this.pluginApi['playMedia']();
			}
			this['paused'] = false;
		}
	},
	load: function() {
		if (this.pluginApi) {
			if (this.isYouTube) {
			} else {
				this.pluginApi['loadMedia']();
			}

			this['paused'] = false;
		}
	},
	pause: function() {
		if (this.pluginApi) {
			if (this.isYouTube) {
				this.pluginApi['pauseVideo']();
			} else {
				this.pluginApi['pauseMedia']();
			}

			this['paused'] = true;
		}
	},
	stop: function() {
		if (this.pluginApi) {
			if (this.isYouTube) {
				this.pluginApi['stopVideo']();
			} else {
				this.pluginApi['stopMedia']();
			}
			this['paused'] = true;
		}
	},
	canPlayType: function(type) {
		var i,
			j,
			pluginInfo,
			pluginVersions = mejs.plugins[this['pluginType']];

		for (i=0; i<pluginVersions.length; i++) {
			pluginInfo = pluginVersions[i];

			// test if user has the correct plugin version
			if (this['pluginType'] == 'flash' && glamFlash['majorVersion'] >= pluginInfo.version) {

				// test for plugin playback types
				for (j=0; j<pluginInfo.types.length; j++) {
					// find plugin that can play the type
					if (type == pluginInfo.types[j]) {
						return 'probably';
					}
				}
			}
		}

		return '';
	},

	positionFullscreenButton: function(x,y,visibleAndAbove) {
		if (this.pluginApi && this.pluginApi['positionFullscreenButton']) {
			this.pluginApi['positionFullscreenButton'](Math.floor(x),Math.floor(y),visibleAndAbove);
		}
	},

	hideFullscreenButton: function() {
		if (this.pluginApi && this.pluginApi['hideFullscreenButton']) {
			this.pluginApi['hideFullscreenButton']();
		}
	},


	// custom methods since not all JavaScript implementations support get/set

	// This can be a url string
	// or an array [{src:'file.mp4',type:'video/mp4'},{src:'file.webm',type:'video/webm'}]
	setSrc: function(url) {
		if (typeof url == 'string') {
			this.pluginApi['setSrc'](mejs.Utility.absolutizeUrl(url));
			this['src'] = mejs.Utility.absolutizeUrl(url);
		} else {
			var i, media;

			for (i=0; i<url.length; i++) {
				media = url[i];
				if (this.canPlayType(media.type)) {
					this.pluginApi['setSrc'](mejs.Utility.absolutizeUrl(media['src']));
					this['src'] = mejs.Utility.absolutizeUrl(url);
					break;
				}
			}
		}

	},
	setCurrentTime: function(time) {
		if (this.pluginApi) {
			if (this.isYouTube) {
				this.pluginApi['seekTo'](time);
			} else {
				this.pluginApi['setCurrentTime'](time);
			}

			this['currentTime'] = time;
		}
	},
	setVolume: function(volume) {
		if (this.pluginApi) {
			// same on YouTube and MEjs
			if (this.isYouTube) {
				this.pluginApi['setVolume'](volume * 100);
			} else {
				this.pluginApi['setVolume'](volume);
			}
			this['volume'] = volume;
		}
	},
	setMuted: function(muted) {
		if (this.pluginApi) {
			if (this.isYouTube) {
				if (muted) {
					this.pluginApi['mute']();
				} else {
					this.pluginApi['unMute']();
				}
				this['muted'] = muted;
				this.dispatchEvent('volumechange');
			} else {
				this.pluginApi['setMuted'](muted);
			}
			this['muted'] = muted;
		}
	},

	// additional non-HTML5 methods
	setVideoSize: function(width, height) {
		if (this.pluginElement.style) {
			this.pluginElement.style.width = width + 'px';
			this.pluginElement.style.height = height + 'px';
		}
		if (this.pluginApi && this.pluginApi['setVideoSize']) {
			this.pluginApi['setVideoSize'](width, height);
		}
	},

	setFullscreen: function(fullscreen) {
		if (this.pluginApi && this.pluginApi['setFullscreen']) {
			this.pluginApi['setFullscreen'](fullscreen);
		}
	},

	enterFullScreen: function() {
		this.setFullscreen(true);
	},

	exitFullScreen: function() {
		this.setFullscreen(false);
	},

	// start: fake events
	addEventListener: function(eventName, callback, bubble) {
		this.events[eventName] = this.events[eventName] || [];
		this.events[eventName].push(callback);
	},
	removeEventListener: function(eventName, callback) {
		if (!eventName) { this.events = {}; return true; }
		var callbacks = this.events[eventName];
		if (!callbacks) return true;
		if (!callback) { this.events[eventName] = []; return true; }
		for (var i = 0; i < callbacks.length; i++) {
			if (callbacks[i] === callback) {
				this.events[eventName].splice(i, 1);
				return true;
			}
		}
		return false;
	},
	dispatchEvent: function (eventName) {
		var i,
			args,
			callbacks = this.events[eventName];

		if (callbacks) {
			args = Array.prototype.slice.call(arguments, 1);
			for (i = 0; i < callbacks.length; i++) {
				callbacks[i].apply(null, args);
			}
		}
	},
	// end: fake events

	// fake DOM attribute methods
	hasAttribute: function(name){
		return (name in this.attributes);
	},
	removeAttribute: function(name){
		delete this.attributes[name];
	},
	getAttribute: function(name){
		if (this.hasAttribute(name)) {
			return this.attributes[name];
		}
		return '';
	},
	setAttribute: function(name, value){
		this.attributes[name] = value;
	},

	remove: function() {
		mejs.Utility.removeSwf(this.pluginElement.id);
		mejs.MediaPluginBridge.unregisterPluginElement(this.pluginElement.id);
	}
};

mejs.PluginMediaElement.prototype['play'] = mejs.PluginMediaElement.prototype.play;
mejs.PluginMediaElement.prototype['load'] = mejs.PluginMediaElement.prototype.load;
mejs.PluginMediaElement.prototype['pause'] = mejs.PluginMediaElement.prototype.pause;
mejs.PluginMediaElement.prototype['stop'] = mejs.PluginMediaElement.prototype.stop;
mejs.PluginMediaElement.prototype['canPlayType'] = mejs.PluginMediaElement.prototype.canPlayType;
mejs.PluginMediaElement.prototype['positionFullscreenButton'] = mejs.PluginMediaElement.prototype.positionFullscreenButton;
mejs.PluginMediaElement.prototype['hideFullscreenButton'] = mejs.PluginMediaElement.prototype.hideFullscreenButton;
mejs.PluginMediaElement.prototype['setSrc'] = mejs.PluginMediaElement.prototype.setSrc;
mejs.PluginMediaElement.prototype['setCurrentTime'] = mejs.PluginMediaElement.prototype.setCurrentTime;
mejs.PluginMediaElement.prototype['setVolume'] = mejs.PluginMediaElement.prototype.setVolume;
mejs.PluginMediaElement.prototype['setMuted'] = mejs.PluginMediaElement.prototype.setMuted;
mejs.PluginMediaElement.prototype['setVideoSize'] = mejs.PluginMediaElement.prototype.setVideoSize;
mejs.PluginMediaElement.prototype['setFullscreen'] = mejs.PluginMediaElement.prototype.setFullscreen;
mejs.PluginMediaElement.prototype['enterFullScreen'] = mejs.PluginMediaElement.prototype.enterFullScreen;
mejs.PluginMediaElement.prototype['exitFullScreen'] = mejs.PluginMediaElement.prototype.exitFullScreen;
mejs.PluginMediaElement.prototype['addEventListener'] = mejs.PluginMediaElement.prototype.addEventListener;
mejs.PluginMediaElement.prototype['removeEventListener'] = mejs.PluginMediaElement.prototype.removeEventListener;
mejs.PluginMediaElement.prototype['dispatchEvent'] = mejs.PluginMediaElement.prototype.dispatchEvent;
mejs.PluginMediaElement.prototype['hasAttribute'] = mejs.PluginMediaElement.prototype.hasAttribute;
mejs.PluginMediaElement.prototype['removeAttribute'] = mejs.PluginMediaElement.prototype.removeAttribute;
mejs.PluginMediaElement.prototype['getAttribute'] = mejs.PluginMediaElement.prototype.getAttribute;
mejs.PluginMediaElement.prototype['setAttribute'] = mejs.PluginMediaElement.prototype.setAttribute;
mejs.PluginMediaElement.prototype['remove'] = mejs.PluginMediaElement.prototype.remove;

/*jshint -W069*/
// Handles calls from Flash and reports them as native <video/audio> events and properties
window[pluginBridgeUniqueFn] = mejs.MediaPluginBridge = {

	pluginMediaElements:{},
	htmlMediaElements:{},

	registerPluginElement: function (id, pluginMediaElement, htmlMediaElement) {
		this.pluginMediaElements[id] = pluginMediaElement;
		this.htmlMediaElements[id] = htmlMediaElement;
	},

	unregisterPluginElement: function (id) {
		delete this.pluginMediaElements[id];
		delete this.htmlMediaElements[id];
	},

	// when Flash is ready, it calls out to this method
	'initPlugin': function (id) {

		var pluginMediaElement = this.pluginMediaElements[id],
			htmlMediaElement = this.htmlMediaElements[id];

		if (pluginMediaElement) {
			// find the javascript bridge
			if(pluginMediaElement['pluginType'] == 'flash') {
				pluginMediaElement.pluginElement = pluginMediaElement.pluginApi = document.getElementById(id);
			}

			if (pluginMediaElement.pluginApi !== null && pluginMediaElement.success) {
				pluginMediaElement.success(pluginMediaElement, htmlMediaElement);
			}
		}
	},

	// receives events from Flash and sends them out as HTML5 media events
	// http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html
	'fireEvent': function (id, eventName, values) {

		var
			e,
			i,
			bufferedTime,
			pluginMediaElement = this.pluginMediaElements[id];

		if(!pluginMediaElement){
            return;
        }

		// fake event object to mimic real HTML media event.
		e = {
			type: eventName,
			target: pluginMediaElement
		};

		// attach all values to element and event object
		for (i in values) {
			pluginMediaElement[i] = values[i];
			e[i] = values[i];
		}

		// fake the newer W3C buffered TimeRange (loaded and total have been removed)
		bufferedTime = values['bufferedTime'] || 0;

		e.target.buffered = e.buffered = {
			start: function(index) {
				return 0;
			},
			end: function (index) {
				return bufferedTime;
			},
			length: 1
		};

		pluginMediaElement.dispatchEvent(e.type, e);
	}
};

/*
Default options
*/
mejs.MediaElementDefaults = {
	// allows testing on HTML5, flash
	// auto: attempts to detect what the browser can do
	// auto_plugin: prefer plugins and then attempt native HTML5
	// native: forces HTML5 playback
	// shim: disallows HTML5, will attempt Flash
	// none: forces fallback view
	'mode': 'auto',
	// remove or reorder to change plugin priority and availability
	'plugins': ['flash','youtube'],
	// shows debug errors on screen
	'enablePluginDebug': false,
	// use plugin for browsers that have trouble with Basic Authentication on HTTPS sites
	'httpsBasicAuthSite': false,
	// overrides the type specified, useful for dynamic instantiation
	'type': '',
	// path to Flash plugins
	'pluginPath': '',
	// name of flash file
	'flashName': 'flashmediaelement.swf',
	// streamer for RTMP streaming
	'flashStreamer': '',
	// turns on the smoothing filter in Flash
	'enablePluginSmoothing': false,
	// enabled pseudo-streaming (seek) on .mp4 files
	'enablePseudoStreaming': false,
	// start query parameter sent to server for pseudo-streaming
	'pseudoStreamingStartQueryParam': 'start',
	// default if the <video width> is not specified
	'defaultVideoWidth': 480,
	// default if the <video height> is not specified
	'defaultVideoHeight': 270,
	// overrides <video width>
	'pluginWidth': -1,
	// overrides <video height>
	'pluginHeight': -1,
	// additional plugin variables in 'key=value' form
	'pluginVars': [],
	// rate in milliseconds for Flash  to fire the timeupdate event
	// larger number is less accurate, but less strain on plugin->JavaScript bridge
	'timerRate': 250,
	// initial volume for player
	'startVolume': 0.8,
	'success': function () { },
	'error': function () { }
};

/*
Determines if a browser supports the <video> or <audio> element
and returns either the native element or a Flash version that
mimics HTML5 MediaElement
*/
mejs.MediaElement = function (el, o) {
	return mejs.HtmlMediaElementShim.create(el,o);
};
mejs.MediaElement['features'] = {
	'nativeFullscreen': mejs.MediaFeatures.hasTrueNativeFullScreen,
	'fullScreenEventName': mejs.MediaFeatures.fullScreenEventName,
	'isFullScreen': mejs.MediaFeatures.isFullScreen,
	'requestFullScreen': mejs.MediaFeatures.requestFullScreen,
	'cancelFullScreen': mejs.MediaFeatures.cancelFullScreen
};

mejs.HtmlMediaElementShim = {

	create: function(el, o) {
		var
			options = mejs.MediaElementDefaults,
			htmlMediaElement = (typeof(el) == 'string') ? document.getElementById(el) : el,
			tagName = htmlMediaElement.tagName.toLowerCase(),
			isMediaTag = (tagName === 'audio' || tagName === 'video'),
			src = (isMediaTag) ? htmlMediaElement.getAttribute('src') : htmlMediaElement.getAttribute('href'),
			poster = htmlMediaElement.getAttribute('poster') || '',
			autoplay =  htmlMediaElement.getAttribute('autoplay'),
			preload =  htmlMediaElement.getAttribute('preload'),
			controls =  htmlMediaElement.getAttribute('controls'),
			playback,
			prop;

		// extend options
		for (prop in o) {
			options[prop] = o[prop];
		}

		// clean up attributes
		src = src ? src : null;
		preload = !preload || preload === 'false' ? 'none' : preload;
		autoplay = autoplay !== null && autoplay !== 'false';
		controls = controls !== null && controls !== 'false';

		// test for HTML5 and plugin capabilities
		playback = this.determinePlayback(htmlMediaElement, options, mejs.MediaFeatures.supportsMediaTag, isMediaTag, src);
		playback.url = (playback.url !== null) ? mejs.Utility.absolutizeUrl(playback.url) : '';

		if (playback.method == 'native') {
			// second fix for android
			if (mejs.MediaFeatures.isBustedAndroid) {
				htmlMediaElement.src = playback.url;
				htmlMediaElement.addEventListener('click', function() {
					htmlMediaElement.play();
				}, false);
			}

			// add methods to native HTMLMediaElement
			return this.updateNative(playback, options, autoplay, preload);
		} else if (playback.method !== '') {
			// create plugin to mimic HTMLMediaElement

			return this.createPlugin( playback,  options, poster, autoplay, preload, controls);
		} else {
			// boo, no HTML5, no Flash
			options['error']();

			return this;
		}
	},

	determinePlayback: function(htmlMediaElement, options, supportsMediaTag, isMediaTag, src) {
		var
			mediaFiles = [],
			i,
			j,
			k,
			l,
			n,
			type,
			result = { method: '', url: '', htmlMediaElement: htmlMediaElement, isVideo: (htmlMediaElement.tagName.toLowerCase() != 'audio')},
			pluginName,
			pluginVersions,
			pluginInfo,
			dummy,
			media;

		// STEP 1: Get URL and type from <video src> or <source src>

		// supplied type overrides <video type> and <source type>
		if (typeof options['type'] != 'undefined' && options['type'] !== '') {

			// accept either string or array of types
			if (typeof options['type'] == 'string') {
				mediaFiles.push({type:options['type'], url:src});
			} else {

				for (i=0; i<options['type'].length; i++) {
					mediaFiles.push({type:options['type'][i], url:src});
				}
			}

		// test for src attribute first
		} else if (src !== null) {
			type = this.formatType(src, htmlMediaElement.getAttribute('type'));
			mediaFiles.push({type:type, url:src});

		// then test for <source> elements
		} else {
			// test <source> types to see if they are usable
			for (i = 0; i < htmlMediaElement.childNodes.length; i++) {
				n = htmlMediaElement.childNodes[i];
				if (n.nodeType == 1 && n.tagName.toLowerCase() == 'source') {
					src = n.getAttribute('src');
					type = this.formatType(src, n.getAttribute('type'));
					media = n.getAttribute('media');

					if (!media || !window.matchMedia || (window.matchMedia && window.matchMedia(media).matches)) {
						mediaFiles.push({type:type, url:src});
					}
				}
			}
		}

		// in the case of dynamicly created players
		// check for audio types
		if (!isMediaTag && mediaFiles.length > 0 && mediaFiles[0].url !== null && this.getTypeFromFile(mediaFiles[0].url).indexOf('audio') > -1) {
			result.isVideo = false;
		}


		// STEP 2: Test for playback method

		// special case for Android which sadly doesn't implement the canPlayType function (always returns '')
		if (mejs.MediaFeatures.isBustedAndroid) {
			htmlMediaElement.canPlayType = function(type) {
				return (type.match(/video\/(mp4|m4v)/gi) !== null) ? 'maybe' : '';
			};
		}


		// test for native playback first
		if (supportsMediaTag && (options['mode'] === 'auto' || options['mode'] === 'auto_plugin' || options['mode'] === 'native')  && !(mejs.MediaFeatures.isBustedNativeHTTPS && options['httpsBasicAuthSite'] === true)) {

			if (!isMediaTag) {

				// create a real HTML5 Media Element
				dummy = document.createElement( result.isVideo ? 'video' : 'audio');
				htmlMediaElement.parentNode.insertBefore(dummy, htmlMediaElement);
				htmlMediaElement.style.display = 'none';

				// use this one from now on
				result.htmlMediaElement = htmlMediaElement = dummy;
			}

			for (i=0; i<mediaFiles.length; i++) {
				// normal check and special case for Mac/Safari 5.0.3 which answers '' to canPlayType('audio/mp3') but 'maybe' to canPlayType('audio/mpeg')
				if (htmlMediaElement.canPlayType(mediaFiles[i].type).replace(/no/, '') !== '' || htmlMediaElement.canPlayType(mediaFiles[i].type.replace(/mp3/,'mpeg')).replace(/no/, '') !== '') {
					result.method = 'native';
					result.url = mediaFiles[i].url;
					break;
				}
			}

			if (result.method === 'native') {
				if (result.url !== null) {
					htmlMediaElement.src = result.url;
				}

				// if `auto_plugin` mode, then cache the native result but try plugins.
				if (options['mode'] !== 'auto_plugin') {
					return result;
				}
			}
		}

		// if native playback didn't work, then test plugins
		if (options['mode'] === 'auto' || options['mode'] === 'auto_plugin' || options['mode'] === 'shim') {
			for (i=0; i<mediaFiles.length; i++) {
				type = mediaFiles[i].type;

				// test all plugins in order of preference [ flash]
				for (j=0; j<options['plugins'].length; j++) {

					pluginName = options['plugins'][j];

					// test version of plugin (for future features)
					pluginVersions = mejs.plugins[pluginName];

					for (k=0; k<pluginVersions.length; k++) {
						pluginInfo = pluginVersions[k];

						// test if user has the correct plugin version

						// for youtube no version check
						if (pluginInfo.version === null || (pluginName == 'flash' && glamFlash['majorVersion'] >= pluginInfo.version)) {

							// test for plugin playback types
							for (l=0; l<pluginInfo.types.length; l++) {
								// find plugin that can play the type
								if (type == pluginInfo.types[l]) {
									result.method = pluginName;
									result.url = mediaFiles[i].url;
									return result;
								}
							}
						}
					}
				}
			}
		}

		// at this point, being in 'auto_plugin' mode implies that we tried plugins but failed.
		// if we have native support then return that.
		if (options['mode'] === 'auto_plugin' && result.method === 'native') {
			return result;
		}

		// what if there's nothing to play? just grab the first available
		if (result.method === '' && mediaFiles.length > 0) {
			result.url = mediaFiles[0].url;
		}

		return result;
	},

	formatType: function(url, type) {
		var ext;

		// if no type is supplied, fake it with the extension
		if (url && !type) {
			return this.getTypeFromFile(url);
		} else {
			// only return the mime part of the type in case the attribute contains the codec
			// see http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html#the-source-element
			// `video/mp4; codecs="avc1.42E01E, mp4a.40.2"` becomes `video/mp4`

			if (type && ~type.indexOf(';')) {
				return type.substr(0, type.indexOf(';'));
			} else {
				return type;
			}
		}
	},

	getTypeFromFile: function(url) {
		if(/(?:youtube\.com\/watch\?v=|youtu\.be\/)\w+/.test(url)) {
			return 'video/youtube';
		} else {
			url = url.split('?')[0];
			var ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
			return (/(mp4|m4v|ogg|ogv|webm|webmv|flv|wmv|mpeg|mov)/gi.test(ext) ? 'video' : 'audio') + '/' + this.getTypeFromExtension(ext);
		}
	},

	getTypeFromExtension: function(ext) {

		switch (ext) {
			case 'mp4':
			case 'm4v':
				return 'mp4';
			case 'webm':
			case 'webma':
			case 'webmv':
				return 'webm';
			case 'ogg':
			case 'oga':
			case 'ogv':
				return 'ogg';
			default:
				return ext;
		}
	},

	createPlugin:function(playback, options, poster, autoplay, preload, controls) {
		var
			htmlMediaElement = playback.htmlMediaElement,
			width = 1,
			height = 1,
			pluginid = 'glm_me_' + playback.method + '_' + (mejs.meIndex++),
			pluginMediaElement = new mejs.PluginMediaElement(pluginid, playback.method, playback.url),
			container = document.createElement('div'),
			specialIEContainer,
			node,
			initVars;

		// copy tagName from html media element
		pluginMediaElement.tagName = htmlMediaElement.tagName;

		// copy attributes from html media element to plugin media element
		for (var i = 0; i < htmlMediaElement.attributes.length; i++) {
			var attribute = htmlMediaElement.attributes[i];
			if (attribute.specified) {
				pluginMediaElement.setAttribute(attribute.name, attribute.value);
			}
		}

		// check for placement inside a <p> tag (sometimes WYSIWYG editors do this)
		node = htmlMediaElement.parentNode;
		while (node !== null && node.tagName.toLowerCase() != 'body') {
			if (node.parentNode.tagName.toLowerCase() == 'p') {
				node.parentNode.parentNode.insertBefore(node, node.parentNode);
				break;
			}
			node = node.parentNode;
		}

		if (playback.isVideo) {
			width = (options['pluginWidth'] > 0) ? options['pluginWidth'] : (options['videoWidth'] > 0) ? options['videoWidth'] : (htmlMediaElement.getAttribute('width') !== null) ? htmlMediaElement.getAttribute('width') : options['defaultVideoWidth'];
			height = (options['pluginHeight'] > 0) ? options['pluginHeight'] : (options['videoHeight'] > 0) ? options['videoHeight'] : (htmlMediaElement.getAttribute('height') !== null) ? htmlMediaElement.getAttribute('height') : options['defaultVideoHeight'];

			// in case of '%' make sure it's encoded
			width = mejs.Utility.encodeUrl(width);
			height = mejs.Utility.encodeUrl(height);

		} else {
			if (options['enablePluginDebug']) {
				width = 320;
				height = 240;
			}
		}

		// register plugin
		pluginMediaElement.success = options['success'];
		mejs.MediaPluginBridge.registerPluginElement(pluginid, pluginMediaElement, htmlMediaElement);

		// add container (must be added to DOM before inserting HTML for IE)
		container.className = 'glm-mejs-plugin';
		container.id = pluginid + '_container';

		if (playback.isVideo) {
				htmlMediaElement.parentNode.insertBefore(container, htmlMediaElement);
		} else {
				document.body.insertBefore(container, document.body.childNodes[0]);
		}

		// flash vars
		initVars = [
			'id=' + pluginid,
			'isvideo=' + ((playback.isVideo) ? "true" : "false"),
			'autoplay=' + ((autoplay) ? "true" : "false"),
			'preload=' + preload,
			'width=' + width,
			'startvolume=' + options['startVolume'],
			'timerrate=' + options['timerRate'],
			'flashstreamer=' + options['flashStreamer'],
			'height=' + height,
			'jsinterface=' + pluginBridgeUniqueFn,
			'pseudostreamstart=' + options['pseudoStreamingStartQueryParam']];

		if (playback.url !== null) {
			if (playback.method == 'flash') {
				initVars.push('file=' + mejs.Utility.encodeUrl(playback.url));
			} else {
				initVars.push('file=' + playback.url);
			}
		}
		if (options['enablePluginDebug']) {
			initVars.push('debug=true');
		}
		if (options['enablePluginSmoothing']) {
			initVars.push('smoothing=true');
		}
		if (options['enablePseudoStreaming']) {
			initVars.push('pseudostreaming=true');
		}
		if (controls) {
			initVars.push('controls=true'); // shows controls in the plugin if desired
		}
		if (poster) {
			initVars.push('poster=' + (playback.method == 'flash' ? mejs.Utility.encodeUrl(poster) : poster));
		}
		if (options['pluginVars']) {
			initVars = initVars.concat(options['pluginVars']);
		}

		switch (playback.method) {
			case 'flash':
				var flash_html = glamFlash(options['pluginPath'] + options['flashName'], width, height, 9, {
						'id': pluginid,
						'name': pluginid,
						'flashvars': initVars.join('&amp;'),
						'wmode': 'transparent',
						'quality': 'high'
					});

				if (mejs.MediaFeatures.isIE) {
					specialIEContainer = document.createElement('div');
					container.appendChild(specialIEContainer);
					specialIEContainer.outerHTML = flash_html;
				} else {
					container.innerHTML = flash_html;
				}

				container.childNodes[0].className = 'glm-mejs-shim';
				break;

			case 'youtube':
				var videoId_match = /v=([\w]+)|youtu\.be\/([\w]+)/.exec(playback.url);

				if(!videoId_match || videoId_match.length < 2) {
					options['error']('invalid YouTube url');
					return false;
				}

				var youtubeSettings = {
						container: container,
						containerId: container.id,
						pluginMediaElement: pluginMediaElement,
						pluginId: pluginid,
						videoId: videoId_match[1] || videoId_match[2],
						height: height,
						width: width,
						controls: controls,
						autoplay: autoplay
					};

				if (glamFlash['majorVersion'] >= 10) {
					mejs.YouTubeApi.createFlash(youtubeSettings);
				} else {
					mejs.YouTubeApi.enqueueIframe(youtubeSettings);
				}

				break;
		}
		// hide original element
		htmlMediaElement.style.display = 'none';
		// prevent browser from autoplaying when using a plugin
		htmlMediaElement.removeAttribute('autoplay');

		// FYI: options.success will be fired by the MediaPluginBridge

		return pluginMediaElement;
	},

	updateNative: function(playback, options, autoplay, preload) {

		var htmlMediaElement = playback.htmlMediaElement,
			m;

		// add methods to video object to bring it into parity with Flash Object
		for (m in mejs.HtmlMediaElement) {
			htmlMediaElement[m] = mejs.HtmlMediaElement[m];
		}

		// fire success code
		options['success'](htmlMediaElement);

		return htmlMediaElement;
	}
};

/*
 - test on IE (object vs. embed)
 - determine when to use iframe (Firefox, Safari, Mobile) vs. Flash (Chrome, IE)
 - fullscreen?
*/

// YouTube Flash and Iframe API
mejs.YouTubeApi = {
	isIframeStarted: false,
	isIframeLoaded: false,
	loadIframeApi: function() {
		if (!this.isIframeStarted) {
			var tag = document.createElement('script');
			tag.src = "//www.youtube.com/player_api";
			var firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
			this.isIframeStarted = true;
		}
	},
	iframeQueue: [],
	enqueueIframe: function(yt) {
		if (this.isLoaded) {
			this.createIframe(yt);
		} else {
			this.loadIframeApi();
			this.iframeQueue.push(yt);
		}
	},
	createIframe: function(settings) {
		var pluginMediaElement = settings.pluginMediaElement,
			player = new window['YT']['Player'](settings.containerId, {
				'height': settings.height,
				'width': settings.width,
				'videoId': settings.videoId,
				'playerVars': {
					'controls': settings.controls ? 1 : 0,
					'wmode': 'opaque',
					'autoplay': settings.autoplay ? 1 : 0,
					'rel': 0,
					'modestbranding': 1
				},
				'events': {
					'onReady': function() {
						// hook up iframe object to MEjs
						settings.pluginMediaElement.pluginApi = player;

						// init mejs
						mejs.MediaPluginBridge['initPlugin'](settings.pluginId);

						// create timer
						setInterval(function() {
							mejs.YouTubeApi.createEvent(player, pluginMediaElement, 'timeupdate');
						}, 250);
					},
					'onStateChange': function(e) {

						mejs.YouTubeApi.handleStateChange(e.data, player, pluginMediaElement);

					}
				}
			});
	},

	createEvent: function (player, pluginMediaElement, eventName) {
		var obj = {
			'type': eventName,
			'target': pluginMediaElement
		};

		if (player && player['getDuration']) {

			// time
			pluginMediaElement['currentTime'] = obj['currentTime'] = player['getCurrentTime']();
			pluginMediaElement['duration'] = obj['duration'] = player['getDuration']();

			// state
			obj['paused'] = pluginMediaElement['paused'];
			obj['ended'] = pluginMediaElement['ended'];

			// sound
			obj['muted'] = player['isMuted']();
			obj['volume'] = player['getVolume']() / 100;

			// progress
			obj['bytesTotal'] = player['getVideoBytesTotal']();
			obj['bufferedBytes'] = player['getVideoBytesLoaded']();

			// fake the W3C buffered TimeRange
			var bufferedTime = obj['bufferedBytes'] / obj['bytesTotal'] * obj['duration'];

			obj['target']['buffered'] = obj['buffered'] = {
				'start': function(index) {
					return 0;
				},
				'end': function (index) {
					return bufferedTime;
				},
				'length': 1
			};

		}

		// send event up the chain
		pluginMediaElement.dispatchEvent(obj['type'], obj);
	},

	iFrameReady: function() {

		this.isLoaded = true;
		this.isIframeLoaded = true;

		while (this.iframeQueue.length > 0) {
			var settings = this.iframeQueue.pop();
			this.createIframe(settings);
		}
	},

	// FLASH!
	flashPlayers: {},
	createFlash: function(settings) {

		this.flashPlayers[settings.pluginId] = settings;

		var specialIEContainer,
			youtubeParams = 'enablejsapi=1&amp;playerapiid=' + settings.pluginId  + '&amp;version=3&amp;autoplay='+(settings.autoplay?1:0)+'&amp;controls='+(settings.controls?1:0)+'&amp;modestbranding=1&loop=0&rel=0',
			youtubeUrl = !settings.controls ? '//www.youtube.com/apiplayer?' : '//www.youtube.com/v/'+settings.videoId+'?';

		var flash_html = glamFlash(youtubeUrl + youtubeParams, settings.width, settings.height, 10, {
				'id': settings.pluginId,
				'name': settings.pluginId,
				'wmode': 'transparent'
			});

		if (mejs.MediaFeatures.isIE) {
			specialIEContainer = document.createElement('div');
			settings.container.appendChild(specialIEContainer);
			specialIEContainer.outerHTML = flash_html;
		} else {
			settings.container.innerHTML = flash_html;
		}

		settings.container.childNodes[0].className = 'glm-mejs-shim';

	},

	flashReady: function(id) {
		var
			settings = this.flashPlayers[id],
			player = document.getElementById(id),
			pluginMediaElement = settings.pluginMediaElement;

		// hook up and return to MediaELementPlayer.success
		pluginMediaElement.pluginApi = pluginMediaElement.pluginElement = player;
		mejs.MediaPluginBridge['initPlugin'](id);

		// load the youtube video
		if(!settings.controls) {
			player['cueVideoById'](settings.videoId);
		}

		var callbackName = settings.containerId + '_callback';

		window[callbackName] = function(e) {
			mejs.YouTubeApi.handleStateChange(e, player, pluginMediaElement);
		};

		player['addEventListener']('onStateChange', callbackName);

		setInterval(function() {
			mejs.YouTubeApi.createEvent(player, pluginMediaElement, 'timeupdate');
		}, 250);
	},

	handleStateChange: function(youTubeState, player, pluginMediaElement) {
		switch (youTubeState) {
			case -1: // not started
				pluginMediaElement['paused'] = true;
				pluginMediaElement['ended'] = true;
				mejs.YouTubeApi.createEvent(player, pluginMediaElement, 'loadedmetadata');
				//createYouTubeEvent(player, pluginMediaElement, 'loadeddata');
				break;
			case 0:
				pluginMediaElement['paused'] = false;
				pluginMediaElement['ended'] = true;
				mejs.YouTubeApi.createEvent(player, pluginMediaElement, 'ended');
				break;
			case 1:
				pluginMediaElement['paused'] = false;
				pluginMediaElement['ended'] = false;
				mejs.YouTubeApi.createEvent(player, pluginMediaElement, 'play');
				mejs.YouTubeApi.createEvent(player, pluginMediaElement, 'playing');
				break;
			case 2:
				pluginMediaElement['paused'] = true;
				pluginMediaElement['ended'] = false;
				mejs.YouTubeApi.createEvent(player, pluginMediaElement, 'pause');
				break;
			case 3: // buffering
				mejs.YouTubeApi.createEvent(player, pluginMediaElement, 'progress');
				break;
			case 5:
				// cued?
				break;

		}

	}
};
// IFRAME
var oldYouTubePlayerAPIReady = window['onYouTubePlayerAPIReady'];
window['onYouTubePlayerAPIReady'] = function() {
	mejs.YouTubeApi.iFrameReady();
	if(typeof oldYouTubePlayerAPIReady == 'function') oldYouTubePlayerAPIReady();
};

// FLASH
var oldYouTubePlayerReady = window['onYouTubePlayerReady'];
window['onYouTubePlayerReady'] = function(id) {
	mejs.YouTubeApi.flashReady(id);
	if(typeof oldYouTubePlayerReady == 'function') oldYouTubePlayerReady(id);
};
return mejs.MediaElement;});