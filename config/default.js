'use strict';
//exports.serverRoot = 'D:\\program\\webapp\\src';
//exports.serverRoot = '/Users/dengyuzhe/WebstormProjects/youku';
exports.serverRoot = '/Users/dengyuzhe/WebstormProjects/webapp';

exports.map = [
	//线上环境

	//wwwtest环境
	//['http://js.ykimg.com/youku/dist', exports.serverRoot+'/src/'],
	//['http://css.ykimg.com/youku/dist', exports.serverRoot+'/src/'],
	//['http://localhost:8080/statics', localHost+'src/'],
	//['http://10.24.32.112:8181/statics', localHost+'src/'],
	//['http://http://10.24.32.156:8080/statics', localHost+'src/'],
	//['https://manager-qa1.everbridge.net/statics', localHost+'src/']

	//['http://localhost:8080/statics', exports.serverRoot+'/src'],
	//['http:///10.24.32.156:8080/statics', exports.serverRoot+'/src'],
	['http://10.24.32.156:8080/statics', exports.serverRoot+'/src']

	//['http://localhost:8080/statics/javascripts', exports.serverRoot+'\\javascripts'],
	//['http://localhost:8080/statics/javascripts', exports.serverRoot+'\\javascripts'],
	//['http://localhost:8080/statics/javascripts', exports.serverRoot+'\\javascripts'],
	//['http://10.24.32.112:8181/statics/javascripts', exports.serverRoot+'\\javascripts'],
	//['https://manager-qa1.everbridge.net/statics/javascripts', exports.serverRoot+'\\javascripts']

];

exports.before = function(url) {
	var Merge = this.util.loadPlugin('merge');

	url = Merge.stripVersionInfo(url);
	url = Merge.cssToLess(url);
	return url;
};

exports.merge = function(url,path, callback) {
	var Merge = this.util.loadPlugin('merge');

	Merge.merge.call(this, url, path, callback);
};
