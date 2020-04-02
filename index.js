const fs = require('fs');
const rp = require('request-promise');
const chalk = require('chalk');
const watch = require('node-watch');

const IGNORE_DIR = [
    'node_modules',
    '.git'
];

function isDir(path) {
    const stat = fs.lstatSync(path);
    return stat.isDirectory();
}

function upload(url, data, filepath, subpath, callback) {
    const options = {
        url
    }
    if (data.type === 'remove') {
        options.body = data;
        options.json = true;
    } else {
        if (isDir(filepath)) return;
        const uploaddata = data;
        options.formData = Object.assign(uploaddata, {
            file: {
                value: fs.createReadStream(filepath),
                options: {
                    filename: subpath
                }
            }
        });
    }
    rp.post(options).then(() => {
        callback();
    }).catch((err) => {
        callback(err);
    })
}



/**
 * http上传
 *
 * @param options
 * @param options.receiver
 * @param options.to
 * @param options.ignoreDir
 *
 * @constructor
 */
function HttpPushPlugin(options) {
    this.options = options;
    if (!this.options || !this.options.to || !this.options.receiver) {
        console.error(chalk.red(`[error]
            请填写默认参数,如:
            new HttpPushPlugin({
                receiver: USER_RECEIVER,
                to: UPLOAD_TO
            });`));
        return;
    }
    if (options.ignoreDir && Object.prototype.toString.call(options.ignoreDir) !== '[object Array]') {
        console.error(chalk.red('ignoreDir为数组'));
        return;
    }
    this.ignoreDir = options.ignoreDir ? options.ignoreDir.concat(IGNORE_DIR) : IGNORE_DIR;
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
        if (isDir(`${path}/${file}`)) {
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
        filter: f => {
            return !(this.ignoreDir.some((item) => f === item));
        },
        recursive: true
    }, (event, name) => {
        upload(opt.receiver, {
            to: `${opt.to}/${name}`,
            type: event
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
