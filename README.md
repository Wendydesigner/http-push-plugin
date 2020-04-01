# http-push-plugin

<a href="https://nodei.co/npm/http-push-plugin/"><img src="https://nodei.co/npm/http-push-plugin.png?downloads=true&downloadRank=true&stars=true"></a>
[![NPM](https://nodei.co/npm/http-push-plugin.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/http-push-plugin/)


## Features
* 本地与服务器http通信
* 修改本地文件，实时上传
* 上传成功失败提醒

## Installation
```bash
npm install http-push-plugin -D
```

## Example

- 本地部署
放在本地目标工程${project}中
```bash
vim ./plugin.js
```
```js
const HttpPushPlugin = require('http-push-plugin');
// 服务端文件上传接口
const USER_RECEIVER = 'http://ip:port/receiver';
// 上传文件目录
const UPLOAD_TO = '/home/**';

new HttpPushPlugin({
    receiver: USER_RECEIVER,
    to: UPLOAD_TO
});
```

- 服务端部署

创建作为服务器的文件夹
```bash
mkdir receiver && cd receiver && vim server.js
```
填充server.js文件
```js
#!/usr/bin/env node

var http = require('http');
var formidable = require('formidable');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var PORT = parseInt(process.argv[2]) || 8900;

var server = http.createServer(function (req, res) {

    function error(err) {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end(err.toString());
    }

    function next(from, to) {
        fs.readFile(from, function (err, content) {
            if (err) {
                error(err);
            } else {
                fs.writeFile(to, content, function (err) {
                    if (err) {
                        error(err);
                    }
                    res.writeHead(200, {'Content-Type': 'text/plain'});
                    res.end('0');
                });
            }
        });
    }

    if (req.url == '/') {
        res.writeHead(200, {'content-type': 'text/html'});
        res.end('I\'m ready for that, you know.');
    } else if (req.url == '/receiver' && req.method.toLowerCase() == 'post') {
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            if (err) {
                error(err);
            } else {
                var to = fields['to'];
                fs.exists(to, function (exists) {
                    if (exists) {
                        fs.unlink(to, function (err) {
                            next(files.file.path, to);
                        });
                    } else {
                        fs.exists(path.dirname(to), function (exists) {
                            if (exists) {
                                next(files.file.path, to);
                            } else {
                                mkdirp(path.dirname(to), 0777, function (err) {
                                    if (err) {
                                        error(err);
                                        return;
                                    }
                                    next(files.file.path, to);
                                });
                            }
                        });
                    }
                });
            }
        });
    }
});

server.listen(PORT, function () {
    console.log('receiver listening *:' + PORT);
});
```
持续启动服务
```bash
nohup node server.js &
```


## 启动
- 本地启动
```bash
cd ${project}
node ./plugin.js
```
