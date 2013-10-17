/*jshint multistr:true */
module.exports = function(grunt) {
	grunt.initConfig({
		dirs: {
			src: 'src/',
			me_src: '<%= dirs.src %>js_mediaelement/',
			output: 'dist/'
		},
		watch: {
			mediaelement: {
				files: ['<%= concat.mediaelement.src %>'],
				tasks: ['concat:mediaelement']
			}
		},
		jshint: {
			options: {
				sub: true
			},
			mediaelement: ['<%= concat.mediaelement.src %>']
		},
		concat: {
			mediaelement: {
				options: {
					banner: '/*======================================================*\r\n'+
							' * BUILT VIA MEDIAELEMENT REPOSITORY - DO NOT EDIT HERE *\r\n'+
							' *======================================================*/\r\n'+
							'glam.create.define("mediaelement", function() {',
					footer: 'return mejs;});'
				},
				src: [
					'<%= dirs.me_src %>me-namespace.js',
					'<%= dirs.me_src %>me-utility.js',
					'<%= dirs.me_src %>me-plugindetector.js',
					'<%= dirs.me_src %>me-featuredetection.js',
					'<%= dirs.me_src %>me-mediaelements.js',
					'<%= dirs.me_src %>me-shim.js',

				],
				dest: '<%= dirs.output %>mediaelement.js'
			},

			me_player: {
				//TODO: remove jquery and add i18n to player
				//'<%= dirs.js_src %>me-i18n.js'
				//'<%= dirs.src %>me-i18n-locale-de.js')
				//'<%= dirs.src %>me-i18n-locale-zh.js')
				src: [
					'<%= dirs.js_src %>mep-header.js',
					'<%= dirs.js_src %>mep-library.js',
					'<%= dirs.js_src %>mep-player.js',
					'<%= dirs.js_src %>mep-feature-playpause.js',
					'<%= dirs.js_src %>mep-feature-stop.js',
					'<%= dirs.js_src %>mep-feature-progress.js',
					'<%= dirs.js_src %>mep-feature-time.js',
					'<%= dirs.js_src %>mep-feature-volume.js',
					'<%= dirs.js_src %>mep-feature-fullscreen.js',
					'<%= dirs.js_src %>mep-feature-tracks.js',
					'<%= dirs.js_src %>mep-feature-contextmenu.js',
					'<%= dirs.js_src %>mep-feature-postroll.js'
				],
				dest: '<%= dirs.output %>mediaelementplayer.js'
			}
		}
	});

	grunt.loadTasks('node_modules/grunt-contrib-watch/tasks');
	grunt.loadTasks('node_modules/grunt-contrib-concat/tasks');
	grunt.loadTasks('node_modules/grunt-contrib-jshint/tasks');

	grunt.registerTask('default', ['jshint:mediaelement', 'concat:mediaelement']);
};

