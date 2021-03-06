/* global require, module, Buffer */
var through = require('through');
var gutil = require('gulp-util');
var request = require('request');
var progress = require('request-progress');
var col = gutil.colors;
var logger = gutil.log;

module.exports = function(urls, opts) {
	var stream = through(function(file, enc, cb) {
		this.push(file);
		cb();
	});


	var files = typeof urls === 'string' ? [urls] : urls;
	var downloadCount = 0;

	var config = {};
	
	if(typeof opts == undefined) {
		opts = {};
	}
	config.silent = opts.silent || false;


	function download(url) {
		var fileName;
		var firstLog = true;

		if (typeof url === 'object') {
			fileName = url.file;
			url = url.url;
		} else {
			fileName = url.split('/').pop();
		}
		progress(
			request({url: url, encoding: null}, downloadHandler),
			{throttle: 1000, delay: 1000}
		)
		.on('progress', function(state) {
			log(state.percent+'%');
		})
		.on('data', function() {
			if(firstLog) {
				log('Downloading '+col.cyan(url)+'...');
				firstLog = false;
			}
		});

		function downloadHandler(err, res, body) {
			var file = new gutil.File( {path: fileName, contents: new Buffer(body)} );
			stream.queue(file);

			log(col.green('Done\n'));
			downloadCount++;
			if(downloadCount != files.length) {
				download(files[downloadCount]);
			}else{
				stream.emit('end');
			}
		}
		/**
		 * Log information to stdout using gutil.log if logging is enabled
		 * @param  {string} data What to log.
		 */
		function log(data) {
			if(!config.silent) logger(data);
		}
	}

	download(files[0]);

	return stream;
};
