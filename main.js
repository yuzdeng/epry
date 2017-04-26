
var Http = require('http');
var Path = require('path');
var Fs = require('fs');
var Iconv = require('iconv-lite');
var Url = require('url');
var Mime = require('mime');
var Request = require('request');
var Watchr = require('watchr');

var HttpProxy = require('http-proxy');
var Util = require('./util');

var Optimist = require('optimist');

Optimist.usage([
	'Usage: pry /path/to/config.js --port=[number] --debug=[true/false]\n\n',
	'Examples:\n',
	'pry ./config/my.js\n',
	'pry ./config/my.js --port=8080\n',
	'pry ./config/my.js --debug=true',
].join(''));

var ARGV = Optimist.argv;

if (ARGV.help || ARGV.h) {
	Optimist.showHelp();
	process.exit();
}

if (ARGV.version || ARGV.v) {
	var packageInfo = JSON.parse(Fs.readFileSync(__dirname + '/package.json', 'utf-8'));
	console.log(packageInfo.version);
	process.exit();
}

var PORT = Util.undef(ARGV.port, 2222);
var CONFIG_FILE = ARGV._.length > 0 ? ARGV._[0] : __dirname + '/config/default.js';
var DEBUG = Util.undef(ARGV.debug, false);

CONFIG_FILE = Path.resolve(CONFIG_FILE);

var CONFIG = require(CONFIG_FILE);

function setResponse(response, contentType, buffer) {
	response.setHeader('Content-Type', contentType);
	response.setHeader('Access-Control-Allow-Origin', '*');
	response.write(buffer);
	response.end();
}

function main() {
	// reload config
	Watchr.watch({
		paths: [CONFIG_FILE],
		listeners: {
			error: function(err) {
				Util.error('[watch] ', err);
			},
			change: function() {
				delete require.cache[CONFIG_FILE];
				CONFIG = require(CONFIG_FILE);
				Util.info('[watch] reload config: ' + CONFIG_FILE);
			}
		}
	});

	// start server
	Http.createServer(function(request, response) {

		var url = request.url;
		var before = CONFIG.before;
		var map = CONFIG.map;
		var merge = CONFIG.merge;

		var me = {
			config : CONFIG,
			util : Util,
			req : request,
			res : response,
		}

		if (DEBUG) {
			console.log('[get] ' + url);
		}

		var from = url;

		if (before) {
			from = before.call(me, from);
		}

		if (from) {
			var serverRoot = /^https?:\/\//.test(url) ? '' : CONFIG.serverRoot;

			var to = Util.rewrite(map, from, serverRoot);

			// rewrite
			if(from !== to){
				Util.info('[rewrite] ' + url + ' -> ' + to);

				// local file
				if (!/^https?:\/\//.test(to)) {
					if (merge) {
						merge.call(me, to, function(contentType, buffer, encoding) {
							if (typeof buffer == 'string' && encoding) {
								buffer = Iconv.toEncoding(buffer, encoding);
							}
							setResponse(response, contentType, buffer);

						});
						return;
					}

					var contentType = Mime.lookup(to);
					var buffer = Util.readFileSync(to);

					setResponse(response, contentType, buffer);
					return;
				}

				// remote URL
				request.pipe(Request(to)).pipe(response);
				return;
			}
		}

		// no rewrite
		var parsed = Url.parse(url);

		var proxy = new HttpProxy.createProxyServer({
			target : {
				host : parsed.hostname,
				port : parsed.port || 80,
			},
		});
		proxy.on('error', function (err, req, res) {
			// res.writeHead(500, {'Content-Type': 'text/plain'});
			if ('/favicon.ico' != parsed.path) { // favicon.ico 出错不显示
				Util.error('[proxy] '+ req.url);
			}

			res.end('Something went wrong. And we are reporting a custom error message.');
		});


		proxy.web(request, response);

	}).listen(PORT);

	console.log('Rewrite Server runing at port: ' + PORT);
}

main();
