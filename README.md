# http-push-plugin

<a href="https://nodei.co/npm/http-push-plugin/"><img src="https://nodei.co/npm/http-push-plugin.png?downloads=true&downloadRank=true&stars=true"></a>
[![NPM](https://nodei.co/npm/http-push-plugin.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/http-push-plugin/)


## Features

* 在无打包工具下的node插件
* 本地与服务器实现文件上传http通信
* 修改本地文件/文件夹，实时上传
* 添加/删除本地文件/文件夹，实时更新
* 上传成功失败提醒
* 添加ignoreDir选项（默认过滤"node_modules", ".git"文件夹）,对其匹配的文件及文件夹进行过滤
* 服务端脚本同样支持webpack/fis等部署

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
    to: UPLOAD_TO,
    ignoreDir: []
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


function isDir(path) {
    const stat = fs.lstatSync(path);
    return stat.isDirectory();
}

function deleteall(path) {
    var files = [];
    if(fs.existsSync(path) && isDir(path)) {
        files = fs.readdirSync(path);
        files.forEach(function(file, index) {
            var curPath = path + "/" + file;
            deleteall(curPath);
        });
        fs.rmdirSync(path);
    } else if (fs.existsSync(path) && !isDir(path)) {
        fs.unlinkSync(path);
    }
};
 
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
                var type = fields['type'];
                if (type === 'remove') {
                    try {
                        deleteall(to);
                        res.end('0');
                    } catch (err) {
                        error(err);
                        return;
                    }
                } else {
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
