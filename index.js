const fs = require('fs');
const rp = require('request-promise');
const chalk = require('chalk');
const watch = require('node-watch');

function upload(url, data, filepath, subpath, callback) {
    const formData = Object.assign(data, {
        file: {
            value: fs.createReadStream(filepath),
            options: {
                filename: subpath
            }
        }
    });
    rp.post({
        url: url,
        formData: formData
    }, function(err, res, body) {
        if (err) {
            callback(err);
            return;
        }
        callback();
    })
}



/**
 * http上传
 *
 * @param options
 * @param options.receiver
 * @param options.to
 *
 * @constructor
 */
function HttpPushPlugin(options) {
    this.options = options;
    this.ignoreDir = [
        'node_modules'
    ];
    this.rootpath = process.cwd();
    this.upload();
    this.watch();
}



HttpPushPlugin.prototype.upload = function(relPath = '') {
    const opt = this.options;
    const path = `${this.rootpath}${relPath}`;
    const relativePath = relPath;
    const list = fs.readdirSync(path);
    list.filter((file) => {
        return this.ignoreDir.indexOf(file) == -1;
    }).forEach(file => {
        const stat = fs.lstatSync(`${path}/${file}`);
        if (stat.isDirectory()) {
            this.upload(`${relativePath}/${file}`);
        } else {
            upload(opt.receiver, {
                to: opt.to + `${relativePath}/${file}`
            }, `${path}/${file}`, file, function(err, res) {
                if (err) {
                    console.error(file + ' - ' + chalk.red('[error] [' + err + ']'));
                } else {
                    console.info(file + chalk.green(' [DONE]'));
                }
            })
        }
    })
};

HttpPushPlugin.prototype.watch = function() {
    const opt = this.options;
    watch('./', {
        filter: f => !/node_modules/.test(f),
        recursive: true
    }, (event, name) => {
        upload(opt.receiver, {
            to: `${opt.to}/${name}`
        }, `${this.rootpath}/${name}`, name, (err, res) => {
            if (err) {
                console.error(name + ' - ' + chalk.red('[error] [' + err + ']'));
            } else {
                console.info(name + chalk.green(' [DONE]'));
            }
        })
    })
}

module.exports = HttpPushPlugin;
