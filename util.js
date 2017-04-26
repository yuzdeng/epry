
var Path = require('path');
var Fs = require('fs');
var Iconv = require('iconv-lite');
var Request = require('request');

function each(obj, fn) {
	for (var key in obj) {

		if (obj.hasOwnProperty(key)) {
			if (fn.call(obj[key], key, obj[key]) === false) {
				break;
			}
		}

	}
}

function isRegExp(val) {
	return Object.prototype.toString.call(val) === '[object RegExp]';
}

function undef(val, defaultVal) {
	return typeof val === 'undefined' ? defaultVal : val;
}

function info(str) {
	console.info('\033[36m', str, '\033[0m');
}

function warn(str) {
	console.warn('\033[33m', str, '\033[0m');
}

function error(str) {
	console.error('\033[31m', str, '\033[0m');
}

function readFileSync(filePath, encoding) {
	var buffer = new Buffer('');

	try {
		buffer = Fs.readFileSync(filePath);
	} catch (e) {
		error(e.toString());
	}

	if (!encoding) {
		return buffer;
	}

	var fileStr = Iconv.fromEncoding(buffer, encoding);

	return fileStr;
}

function get(url, encoding, callback) {
	Request({
		url : url,
		encoding : null
	}, function (error, response, buffer) {
		if (!error && response.statusCode == 200) {
			if (encoding) {
				buffer = Iconv.fromEncoding(buffer, encoding);
			}
			callback(buffer);
		}
	});
}

function loadPlugin(name) {
	return require(__dirname + '/plugins/' + name + '.js');
}

// return value: url or path
function rewrite(map, url, serverRoot) {
	// rewrite by map
	for (var i = 0, len = map.length; i < len; i++) {
		var row = map[i];

		if (row.length != 2) {
			continue;
		}

		var from = row[0];
		var to = row[1];

		if (serverRoot) {
			from = from.replace(/^https?:\/\/[^\/]+/, '');
		}

		var index = url.indexOf(from);

		if (index === 0) {
			var suffix = url.substr(index + from.length);

			if (/^https?:\/\//.test(to)) {
				return to + suffix;
			}

			suffix = suffix.replace(/[?#].*$/, '');
			return Path.resolve(to + suffix);
		}
	}
	// rewrite all
	if (serverRoot) {
		var to = serverRoot + url.replace(/^https?:\/\/[^\/]+|\?.*$/, '');
		return Path.resolve(to);
	}
	return url;
}

exports.each = each;
exports.isRegExp = isRegExp;
exports.undef = undef;
exports.info = info;
exports.warn = warn;
exports.error = error;
exports.loadPlugin = loadPlugin;
exports.readFileSync = readFileSync;
exports.get = get;
exports.rewrite = rewrite;
