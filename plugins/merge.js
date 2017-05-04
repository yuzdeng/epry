var Fs = require('fs');
var Path = require('path');
var Util = require('../util');
var Less = require('less');
var Mime = require('mime');
var Iconv = require('iconv-lite');
//var ReactTools = require('react-tools');

	var RE_AUTOFIXNAME = /define\((?=[^'"])/;

// URL移除版本号
function stripVersionInfo(url) {
	return url.replace(/([^?]+)_\d+(\.(?:js|css|swf|png|jpg|gif))/i, '$1$2');
}

// CSS扩展名改成LESS
function cssToLess(url) {
	return url.replace(/\.css/, '.less');
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
	var relativePath = path.split(Path.sep).join('/').replace(/^.+\/src\/js\//, '');
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

function replaceCombomText(path,str){
		var sourceMapRoot=path.replace(/^(.*?)[\\\/](javascripts|combine)[\\\/].*$/, '$1');
		var subDir = /js\//.test(path)?"js":'javascripts';
		var dist='';
		//获取sourceMap的list
		var sourceMapList = Util.getSourceMap(str);
		var rootPath = sourceMapRoot+'/'+subDir;
		var dist=Util.getComboText(rootPath,sourceMapList);
		return dist ? dist : str;
		//if(sourceMapList){
		//	//var sourceMapList=sourceMap[0].split("@sourceMap:");
		//	for(var i=0;i<sourceMapList.length;i++){
		//		if((/\.js/g).test(sourceMapList[i])){
		//			var sourceMapUrl=sourceMapList[i].match(/.+?\.js/g);
		//			var sourcePath=sourceMapRoot+'/'+subDir+'/'+sourceMapUrl[0];
		//			var sourceMapFileStr=Util.readFileSync(sourcePath,'utf8');
		//			dist+=sourceMapFileStr + '\n';
		//			//pathMap[sourcePath]=sourceMapFileStr;
		//		}
		//	}
		//	return dist;
        //
		//}
		//return str;

}

// 合并本地文件
function merge(url,path, callback) {
	var root = path.replace(/^(.*?)[\\\/](src|build|dist)[\\\/].*$/, '$1');

	var newPath = path.split(Path.sep).join('/');

	// CSS
	if (/\.less/.test(newPath)) {
		var str = Util.readFileSync(path, 'utf-8');

		var parser = new(Less.Parser)({
			env : 'development',
			dumpLineNumbers : 'comments',
			paths : ['.', root + '/src/stylesheet'],
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

	if (/src\/(javascripts|combine)\/.+\.js$/.test(newPath)) { //!/src\/javascripts\/(lib|lite|loader|react)\.js$/.test(newPath) &&
		if(Fs.existsSync(path)){
			var str = Util.readFileSync(path, 'utf-8');
			//str = fixModule(path, str);
			str = replaceCombomText(path,str);
			//if (str.indexOf('use strict') > 0) {
			//	str = ReactTools.transform(str, { harmony: true });
			//	// console.log(ReactTools.transform(str));
			//}
			return callback('application/javascript', str);
		}else{
			if(/combine\/.+\.js$/.test(newPath)){
				Util.get(url,'utf-8',function(str){
					str = replaceCombomText(path,str);
					return callback('application/javascript', str);
				});
			}else{
				return console.error('Not find File: '+ path)

			}
		}
	}else{
		var contentType = Mime.lookup(path);
		var buffer = Util.readFileSync(path);

		return callback(contentType, buffer);
	}


}

exports.stripVersionInfo = stripVersionInfo;
exports.cssToLess = cssToLess;
exports.merge = merge;
