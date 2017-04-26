
var test = require('tap').test;

var util = require('../util');

test('util.rewrite (empty map)', function(t) {
	var map = [];

	var url = 'http://js.tudouui.com/js/lib/tuilib2_10.js';
	var result = util.rewrite(map, url);
	t.equal(result, 'http://js.tudouui.com/js/lib/tuilib2_10.js');

	t.end();
});

test('util.rewrite (to local file)', function(t) {
	var root = 'D:\\project\\kindeditor';
	var localPath = require('path').resolve(root + '/kindeditor.js');

	var map = [
		['http://js.tudouui.com/js/lib/kindeditor-min.js', localPath],
	];

	var url = 'http://js.tudouui.com/js/lib/kindeditor-min.js';
	var result = util.rewrite(map, url);
	t.equal(result, 'D:\\project\\kindeditor\\kindeditor.js');

	t.end();
});

test('util.rewrite (to local file: partial URL)', function(t) {
	// 1
	var root = 'D:\\project';
	var localPath = require('path').resolve(root + '/kindeditor/');
	var map = [
		['http://js.tudouui.com/js/lib', localPath],
	];
	var url = 'http://js.tudouui.com/js/lib/kindeditor.js';
	var result = util.rewrite(map, url);
	t.equal(result, 'D:\\project\\kindeditor\\kindeditor.js');

	// 2
	var map = [
		['http://www.kindsoft.net/ke4', 'D:\\project\\kindsoft\\ke4'],
	];
	var url = 'http://www.kindsoft.net/ke4/kindeditor.js';
	var result = util.rewrite(map, url);
	t.equal(result, 'D:\\project\\kindsoft\\ke4\\kindeditor.js');

	// 3
	var url = 'http://www.kindsoft.net/ke4/themes/default/default.css?t=20121118.css';
	var result = util.rewrite(map, url);
	t.equal(result, 'D:\\project\\kindsoft\\ke4\\themes\\default\\default.css');

	// 4
	var url = 'http://www.kindsoft.net/';
	var result = util.rewrite(map, url);
	t.equal(result, 'http://www.kindsoft.net/');

	t.end();
});

test('util.rewrite (to remote file: partial URL)', function(t) {
	// 1
	var map = [
		['http://js.tudouui.com/js/lib', 'http://jstest.tudouui.com/js/lib'],
	];
	var url = 'http://js.tudouui.com/js/lib/tuilib2_10.js';
	var result = util.rewrite(map, url);
	t.equal(result, 'http://jstest.tudouui.com/js/lib/tuilib2_10.js');

	// 2
	var map = [
		['http://js.tudouui.com/js/lib/tuilib2_10.js', 'http://jstest.tudouui.com/js/lib/tuilib2_10.js'],
	];
	var url = 'http://js.tudouui.com/js/lib/tuilib2_10.js';
	var result = util.rewrite(map, url);
	t.equal(result, 'http://jstest.tudouui.com/js/lib/tuilib2_10.js');

	// 3
	var url = 'http://js.tudouui.com/js/lib/tuilib2_10.js?t=20121118.css';
	var result = util.rewrite(map, url);
	t.equal(result, 'http://jstest.tudouui.com/js/lib/tuilib2_10.js?t=20121118.css');

	// 4
	var url = 'http://www.kindsoft.net/';
	var result = util.rewrite(map, url);
	t.equal(result, 'http://www.kindsoft.net/');

	t.end();
});

test('util.rewrite (rewrite all)', function(t) {
	var root = 'D:\\project\\kindeditor';
	var localPath = require('path').resolve(root + '/kindeditor.js');

	// 1
	var map = [
		['http://js.tudouui.com/js/lib/kindeditor-min.js', localPath],
	];

	var url = '/js/lib/kindeditor-min.js';
	var result = util.rewrite(map, url, root);
	t.equal(result, 'D:\\project\\kindeditor\\kindeditor.js');

	// 2
	var map = [
		['http://js.tudouui.com/js/lib/kindeditor-min.js', localPath],
	];

	var url = '/js/lib/kindeditor-all.js';
	var result = util.rewrite(map, url, root);
	t.equal(result, 'D:\\project\\kindeditor\\js\\lib\\kindeditor-all.js');

	t.end();
});