var Fs = require('fs');
var Path = require('path');
var Util = require('../util');
var Less = require('less');
var Mime = require('mime');
var Iconv = require('iconv-lite');
var ReactTools = require('react-tools');

var RE_AUTOFIXNAME = /define\((?=[^'"])/;

// URL移除版本号
function stripVersionInfo(url) {
	return url.replace(/([^?]+)_\d+(\.(?:js|css|swf|png|jpg|gif))/i, '$1$2');
}

// CSS扩展名改成LESS
function cssToLess(url) {
	return url.replace(/\.css$/, '.less');
}

function resolveUrl(url) {
	while(true) {
		url = url.replace(/\w+\/\.\.\//g, '');
		if (!/\.\.\//.test(url)) {
			break;
		}
	}
	url = url.replace(/\.\//g, '');
	return url;
}

// 将JS代码改成AMD模块，包含路径转换，补充模块ID，模板转换等
function fixModule(path, str) {
	var root = path.replace(/^(.*?)[\\\/](src|build|dist)[\\\/].*$/, '$1');
	var relativePath = path.split(Path.sep).join('/').replace(/^.+\/src\//, '');
	var mid = relativePath.replace(/\.js$/, '');
	function fixDep(s, format) {
		if (format) {
			s = s.replace(/\s/g, '');
		}
		return s.replace(/(['"])(.+?)\1(,?)/g, function($0, $1, $2, $3) {
			var f = $2;
			if(f.charAt(0) == '.') {
				f = relativePath.replace(/[\w-]+\.js$/, '') + f;
				f = resolveUrl(f);
			}
			else if(f.charAt(0) == '/') {
				f = f.slice(1);
			}
			if (format) {
				return '\n  "' + f + '"' + $3 + '\n';
			} else {
				return $1 + f + $1 + $3;
			}
		}).replace(/,\n\n/g, ',\n');
	}

	// 补充模块ID
	if(/(?:^|[^\w\.])define\s*\(/.test(str) && !/(?:^|[^\w\.])define\s*\(\s*['"]/.test(str)) {
		str = str.replace(/\b(define\s*\(\s*)/, '$1"' + mid + '", ');
	}

	// 补齐依赖
	str = str.replace(/((?:^|[^\w\.])define\s*\(\s*['"].*?['"]\s*,\s*)([['"][\s\S]+?)(,\s*function\s*\()/g, function($0, $1, $2, $3) {
		return $1 + fixDep($2, true) + $3;
	});
	str = str.replace(/((?:^|[^\w\.])require\s*\(\s*)([\['"][\s\S]+?)(,\s*function\s*\()/g, function($0, $1, $2, $3) {
		return $1 + fixDep($2, false) + $3;
	});
	str = str.replace(/((?:^|[^\w\.])define\s*\(\s*['"].*?['"]\s*)(,\s*function\s*\()/g, '$1,[]$2');

	// 非AMD模块
	if(!/(?:^|[^\w\.])(define|require)\s*\(/.test(str)) {
		return str += '\n/* autogeneration */\n"define" in this && define("' + mid + '", [], function(){});\n';
	}

	return str;
}

// Replace require.text to string
function replaceTemplate(path, str) {
	var root = path.replace(/^(.*?)[\\\/](src|build|dist)[\\\/].*$/, '$1');
	// sub template
	function replaceSubTemplate(parentPath, str) {
		Util.info('[import template] ' + parentPath);
		return str.replace(/<%\s*require\.text\(\s*(['"])(.+?)\1\s*\);?\s*%>/g, function($0, $1, $2) {
			var f = $2;
			if(/^[a-z_/]/i.test(f)) {
				f = root + '/src/' + f;
			}
			else {
				f = parentPath.replace(/[\w-]+\.\w+$/, '') + f;
				f = resolveUrl(f);
			}
			var s = Util.readFileSync(f, 'utf-8');
			s = replaceSubTemplate(f, s);
			s = s.replace(/^\uFEFF/, '');
			return s;
		});
	}

	// replace template string
	str = str.replace(/(\b)require\.text\(\s*(['"])(.+?)\2\s*\)/g, function($0, $1, $2, $3) {
		var f = $3;
		if(/^[a-z_/]/i.test(f)) {
			f = root + '/src/' + f;
		}
		else {
			f = path.replace(/[\w-]+\.\w+$/, '') + f;
			f = resolveUrl(f);
		}
		var s = Util.readFileSync(f, 'utf-8');
		s = replaceSubTemplate(f, s);
		s = s.replace(/^\uFEFF/, '');
		s = s.replace(/\\/g, '\\\\');
		s = s.replace(/(\r\n|\r|\n)\s*/g, '\\n');
		s = s.replace(/'/g, "\\'");
		return $1 + "'" + s + "'";
	});

	return str;
}

// 合并本地文件
function merge(path, callback) {
	var root = path.replace(/^(.*?)[\\\/](src|build|dist)[\\\/].*$/, '$1');

	var newPath = path.split(Path.sep).join('/');

	// CSS
	if (/\.less$/.test(newPath)) {
		var str = Util.readFileSync(path, 'utf-8');

		var parser = new(Less.Parser)({
			env : 'development',
			dumpLineNumbers : 'comments',
			paths : ['.', root + '/src'],
			filename : path,
		});

		parser.parse(str, function(error, tree) {
			if (error) {
				return console.error(error);
			}
			callback('text/css', tree.toCSS());
		});
		return;
	}

	if (!/src(\/[^\/]+)+\/(lib|lite|loader|react)\.js$/.test(newPath) && /src(\/[^\/]+)+\/.+\.js$/.test(newPath)) {
		if(Fs.existsSync(path)){
			var str = Util.readFileSync(path, 'utf-8');
			str = fixModule(path, str);
			str = replaceTemplate(path, str);
			if (str.indexOf('use strict') > 0) {
				str = ReactTools.transform(str, { harmony: true });
				// console.log(ReactTools.transform(str));
			}
			return callback('application/javascript', str);
		}else{
			return console.error('Not find File: '+ path)
		}
	}

	var contentType = Mime.lookup(path);
	var buffer = Util.readFileSync(path);

	return callback(contentType, buffer);
}

exports.stripVersionInfo = stripVersionInfo;
exports.cssToLess = cssToLess;
exports.merge = merge;
