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

			this['paused'] = false;
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
