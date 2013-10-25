// Namespace
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
