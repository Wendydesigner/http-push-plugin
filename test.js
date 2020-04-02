const HttpPushPlugin = require('./index');
// 服务端文件上传接口
const USER_RECEIVER = 'http://localhost:8900/receiver';
// 上传文件目录
const UPLOAD_TO = `${process.cwd()}/../test`;

new HttpPushPlugin({
    receiver: USER_RECEIVER,
    to: UPLOAD_TO
});
