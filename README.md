HTTP Rewrite Tool based on hrt tool
=================================================

epry是前端代理工具，根据配置把指定的URL指向到本地文件或远程URL。

### 安装

```
npm install prt -g
```

### 使用方法

1. 修改浏览器代理设置，IP：`127.0.0.1`，端口：`2222`，推荐用SwitchySharp（Chrome插件）、FoxyProxy（Firefox插件）切换代理。

2. 创建配置文件 `epry-config.js` ，添加跳转规则。

	代理文件：
	```js
	exports.map = [
		['http://localhost:8080/statics/javascript/lib.js', 'D:\\project\\statics\\javascript\\lib.js']
	];
	```

	代理目录：
	```js
	exports.map = [
		['http://localhost:8080/statics', 'D:\\project\\statics']
	];
	```

3. 在命令行输入 `epry epry-config.js` ，启动HTTP服务。

	```bash
	# 修改端口
	epry epry-config.js --port=2222,默认端口是2222
	# 输出调试信息
	epry epry-config.js --debug=true
	```

### 高级用法

1. 移除版本号。
	```js
	exports.before = function(url) {
		return url.replace(/([^?]+)_\d+(\.(?:js|css))/, '$1$2');
	};
	```

2. 修改文件内容。
	```js
	exports.merge = function(path, callback) {
		// 所有JS头部添加注释
		if (/\.js$/.test(path)) {
			var content = Util.readFileSync(path, 'utf-8');
			return callback('application/javascript', '/* test /*\n' + content);
		}
		// 其它请求
		var contentType = require('mime').lookup(path);
		var buffer = this.util.readFileSync(path);
		return callback(contentType, buffer);
	};
	```
	注：当配置文件里有 `exports.merge` 时会接管所有请求，所以在程序逻辑里需要加入文件类型判断。

3. 修改URL内容。
	```js
	exports.merge = function(path, callback) {
		if (/^http:\/\/(www|wwwtest|beta)\.everbridge\.com\/statics\/javascripts\//.test(this.req.url)) {
			this.util.get(this.req.url, 'gbk', function(body) {
				callback('text/html', body + '<!-- test -->', 'gbk');
			});
			return;
		}
		// 其它请求
		var contentType = require('mime').lookup(path);
		var buffer = this.util.readFileSync(path);
		return callback(contentType, buffer);
	};
	```