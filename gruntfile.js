/*jshint multistr:true */
module.exports = function(grunt) {
	grunt.initConfig({
		dirs: {
			src: 'src/',
			js_library: '<%= dirs.src %>js_library/',
			js_skin: '<%= dirs.src %>js_skin/',
			swf_src: '<%= dirs.src %>flash/',
			output: 'dist/',
			flexpath: '/Users/adamh/flex-sdk/'
		},
		watch: {
			mediaelement_swf: {
				files: ['<%= swf_src %>**/*.as'],
				tasks: ['shell:swf']
			},
			mediaelement: {
				files: ['<%= concat.mediaelement.src %>'],
				tasks: ['concat:mediaelement']
			}
		},
		jshint: {
			options: {
				sub: true
			},
			mediaelement: ['<%= concat.mediaelement.src %>'],
			me_skin: ['<%= concat.me_skin.src %>']
		},
		concat: {
			mediaelement: {
				options: {
					banner: '/*======================================================*\r\n'+
							' * BUILT VIA MEDIAELEMENT REPOSITORY - DO NOT EDIT HERE *\r\n'+
							' *======================================================*/\r\n'+
							'glam.create.define("mediaelement", ["flash"], function(glamFlash) {',
					footer: 'return mejs.MediaElement;});'
				},
				src: [
					'<%= dirs.js_library %>me-namespace.js',
					'<%= dirs.js_library %>me-utility.js',
				//	'<%= dirs.js_library %>me-plugindetector.js',
					'<%= dirs.js_library %>me-featuredetection.js',
					'<%= dirs.js_library %>me-mediaelements.js',
					'<%= dirs.js_library %>me-shim.js',

				],
				dest: '<%= dirs.output %>mediaelement.js'
			},

			me_skin: {
				//TODO: remove jquery and add i18n to player
				//'<%= dirs.js_skin %>me-i18n.js'
				//'<%= dirs.js_skin %>me-i18n-locale-de.js'
				//'<%= dirs.js_skin %>me-i18n-locale-zh.js'
				src: [
					'<%= dirs.js_skin %>mep-header.js',
					'<%= dirs.js_skin %>mep-library.js',
					'<%= dirs.js_skin %>mep-player.js',
					'<%= dirs.js_skin %>mep-feature-playpause.js',
					'<%= dirs.js_skin %>mep-feature-stop.js',
					'<%= dirs.js_skin %>mep-feature-progress.js',
					'<%= dirs.js_skin %>mep-feature-time.js',
					'<%= dirs.js_skin %>mep-feature-volume.js',
					'<%= dirs.js_skin %>mep-feature-fullscreen.js',
					'<%= dirs.js_skin %>mep-feature-tracks.js',
					'<%= dirs.js_skin %>mep-feature-contextmenu.js',
					'<%= dirs.js_skin %>mep-feature-postroll.js'
				],
				dest: '<%= dirs.output %>mediaelementplayer.js'
			},
			skin_css: {
				src: [ '<%= dirs.src %>css/mediaelementplayer.css'],
				dest: '<%= dirs.output %>mediaelementplayer.css'
			}
		},
		shell: {
			swf: {
				command: '<%= dirs.flexpath %>bin/mxmlc -strict=false -warnings=true src/flash/FlashMediaElement.as -o dist/flashmediaelement.swf -library-path+="<%= dirs.flexpath %>lib" -include-libraries+=src/flash/flashmediaelement.swc -use-network=true -headless-server -static-link-runtime-shared-libraries'
			},
			swf_debug: {
				command: '<%= shell.swf.command %> -debug=true	'
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-shell');

	grunt.registerTask('skin', ['jshint:me_skin', 'concat:me_skin', 'concat:skin_css']);
	grunt.registerTask('default', ['jshint:mediaelement', 'concat:mediaelement']);
};

