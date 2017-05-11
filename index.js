/* global require, module, Buffer */
var through = require('through');
var gutil = require('gulp-util');
var request = require('request');
var progress = require('request-progress');
var col = gutil.colors;
var log = gutil.log;

module.exports = function(urls) {
	var stream = through(function(file, enc, cb) {
		this.push(file);
		cb();
	});


	var files = typeof urls === 'string' ? [urls] : urls;
	var downloadCount = 0;


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
	}
	download(files[0]);

	return stream;
};
