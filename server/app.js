const express = require('express');
const session = require('express-session');
const svgCaptcha = require('svg-captcha');
const SQLiteStore = require('connect-sqlite3')(session);
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const request = require('util').promisify(require('request'));
var md5 = require("md5");

const PORT = 18878;

// 文件上传
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const app = express();
const db = new sqlite3.Database('data.db');



// Express中间件配置
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    store: new SQLiteStore({ db: '/sessionsDB.sqlite', concurrentDB: true }),
    secret: 'your-secret-key', // 用于签名 sessionID 的密钥
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 设置 session 的有效期，这里为一天
        secure: false, // 在生产环境中使用HTTPS时设为true
    },
})
);


db.serialize(() => {
    db.run(
        `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT,
             uid TEXT UNIQUE,
             username TEXT NOT NULL,
             password TEXT NOT NULL)`
    );
    db.run(
        `CREATE TABLE IF NOT EXISTS msgdata (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fromuid TEXT NOT NULL,
            touid TEXT NOT NULL,
            message TEXT,
            time TIMESTAMP DEFAULT (datetime('now', 'localtime')),
            type TEXT NOT NULL,
            status BOOLEAN DEFAULT FALSE)`
    );
    db.run(
        `CREATE TABLE IF NOT EXISTS friendlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uid TEXT,
            friend TEXT)`
    );
    db.run(
        `CREATE TABLE IF NOT EXISTS wstoken (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uid TEXT NOT NULL,
            username TEXT NOT NULL,
            token TEXT NOT NULL)`
    )
});



app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*'); // 设置允许访问的域名
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept'); // 设置允许的header类型
    res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS'); // 设置允许的请求类型
    res.header('Access-Control-Allow-Credentials', true); // 设置是否允许发送 cookies
    // console.log(req.path)
    if (req.path.startsWith('/api/user') || req.path.startsWith('/api/admin')) {
        // console.log("需要登录")
        // console.log(req.session)
        if (!req.session.loginType) {
            return res.status(401).send({ "status": 0, "msg": "请先登录", "data": null })
        }
    }
    next();
});


app.get('/api/verify', async (req, res) => {
    // 获取id参数值
    // 生成验证码配置
    const captcha = svgCaptcha.create({
        size: 4, // 验证码长度
        noise: 3, // 干扰线条的数量
        color: true, // 验证码字符是否有颜色，默认为 false
        background: '#f0f0f0' // 背景颜色，默认为随机色
    });
    // 将验证码文本保存到 session 中（示例中未使用 session）
    req.session.captcha = captcha.text;
    console.log(captcha.text);
    // 设置响应类型为 SVG 图像
    res.type('svg');
    // 发送生成的验证码 SVG 到客户端
    res.send(captcha.data);
});

// 验证码校验拦截器
const vcaptcha = async (req, res, next) => {
    if (req.session.scranQR) {
        return next();
    }
    const { captcha } = req.body;
    if (!captcha) {
        return res.send({ "status": 0, "msg": "验证码不能为空", "data": null })
    }
    if (captcha.toLowerCase() != req.session.captcha.toLowerCase()) {
        return res.send({ "status": 0, "msg": "验证码错误", "data": null })
    }
    return next();
}

app.post('/api/register', vcaptcha, (req, res) => {
    const { password } = req.body;
    const { uid, username } = req.session
    // const { uid, username, password } = req.body;
    // console.log(uid, username, password)
    if (!password || !uid || !username) {
        return res.send({ "status": 0, "msg": "参数错误", "data": null })
    }
    db.get('SELECT * FROM users WHERE uid = ?', [uid], (err, row) => {
        if (err) {
            return res.status(500).send({ "status": 0, "msg": err.message, "data": null });
        }
        if (row) {
            return res.send({ "status": 0, "msg": "用户已存在", "data": null })
        }
        db.run('INSERT INTO users (uid, username, password) VALUES (?, ?, ?)', [uid, username, password], function (err) {
            if (err) {
                return res.status(500).send({ "status": 0, "msg": err.message, "data": null });
            }
            req.session.scranQR = false
            req.session.loginType = 'user';
            req.session.username = username;
            req.session.uid = uid
            console.log(req.session)
            return res.send({ "status": 1, "msg": "注册成功", "data": null })
        });
    });
});

app.post('/api/login', vcaptcha, (req, res) => {
    if (req.session.scranQR) {
        var username = req.session.uid
        var password = "扫码用户"
    } else {
        var { username, password } = req.body;
    }
    console.log(username, password)
    if (!username || !password) {
        return res.send({ "status": 0, "msg": "账号或密码为空", "data": null })
    }
    db.get('SELECT * FROM users WHERE uid = ?', [username], (err, row) => {
        if (err) {
            return res.status(500).send({ "status": 0, "msg": err.message, "data": null });
        }
        if (!row) {
            return res.send({ "status": 3, "msg": "账号不存在", "data": null })
        }
        if (req.session.scranQR) {
            req.session.loginType = 'user';
            req.session.scranQR = false
            return res.send({ "status": 1, "msg": "登录成功", "data": null })
        }
        // console.log(row.password, password)
        if (md5(row.password) != password) {
            return res.send({ "status": 0, "msg": "密码错误", "data": null })
        }
        req.session.loginType = 'user';
        req.session.username = row.username;
        req.session.uid = username;
        return res.send({ "status": 1, "msg": "登录成功", "data": null })
    });
});


app.post('/api/user/logout', (req, res) => {
    req.session.destroy();
    res.send({ "status": 1, "msg": "退出成功", "data": null })
})

app.get('/api/qr/qrcode', async (req, res) => {
    var getCookie = await request({ url: "https://cas.xxu.edu.cn/cas/qr/comet", method: "post" })
    // console.log(getCookie.headers)
    var cookie = getCookie.headers['set-cookie'][0]
    // console.log(cookie)
    req.session.xxxycasQrCookie = cookie
    var getQrcode = await request({ url: "https://cas.xxu.edu.cn/cas/qr/qrcode", method: "get", headers: { cookie: cookie }, encoding: null });
    res.setHeader('Content-Type', 'image/png'); // Set the correct Content-Type header
    res.send(getQrcode.body)
});



app.post('/api/qr/comet', async (req, res) => {
    var cookie = req.session.xxxycasQrCookie
    var getComet = await request({ url: "https://cas.xxu.edu.cn/cas/qr/comet", method: "post", headers: { cookie: cookie }, json: true });
    // console.log(getComet.body)
    if (getComet.body.data.qrCode.status == "3") {
        headers = {
            'X-Id-Token': getComet.body.data.qrCode.apptoken
        }
        req.session.userToken = getComet.body.data.qrCode.apptoken
        var userInfo = await request({ url: "https://authx-service.xxu.edu.cn/personal/api/v1/personal/user/info", method: "get", headers: headers, json: true });
        console.log(userInfo.body)
        req.session.uid = userInfo.body.data.user.uid
        req.session.username = userInfo.body.data.user.name
        req.session.scranQR = true
        console.log(req.session.username)
        getComet.body.data.qrCode.apptoken = null
        getComet.body.data.qrCode.uid = userInfo.body.data.user.uid
        getComet.body.data.qrCode.name = userInfo.body.data.user.name
        req.session.xxxycasQrCookie = null
    }
    if (getComet.body.data.qrCode.status == "2") {
        getComet.body.data.qrCode.apptoken = null
    }
    res.send(getComet.body)
});


app.get('/api/user/messageList', (req, res) => {
    const { uid } = req.session;
    db.all('SELECT * FROM msgdata WHERE touid = ? or fromuid = ?', [uid, uid], (err, rows) => {
        if (err) {
            return res.status(500).send({ "status": 0, "msg": err.message, "data": null });
        }
        return res.send({ "status": 1, "msg": "获取成功", "data": rows })
    });
})

function getUserName(uid) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE uid = ?', [uid], (err, row) => {
            if (err) {
                reject(err);
            }
            if (!row) {
                reject(new Error('User not found'));
            }
            resolve(row.username);
        });
    });
}

function noStatusMessageCount(touid, fromuid) {
    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) AS count FROM msgdata WHERE touid = ? AND fromuid = ? AND status = FALSE', [touid, fromuid], (err, row) => {
            if (err) {
                reject(err);
            }
            if (!row) {
                console.log("User not found")
                reject(new Error('User not found'));
            }
            resolve(row.count);
        });
    });
}

app.get('/api/user/messageLastList', async (req, res) => {
    const { uid } = req.session;
    db.all(`SELECT *
    FROM msgdata
    WHERE (fromuid = ? OR touid = ?)
    AND (id, time) IN (
        SELECT MAX(id) AS id, MAX(time) AS time
        FROM msgdata
        WHERE fromuid = ? OR touid = ?
        GROUP BY CASE
            WHEN fromuid = ? THEN touid
            ELSE fromuid
        END
    )
    ORDER BY time DESC`, [uid, uid, uid, uid, uid], async (err, rows) => {
        if (err) {
            return res.status(500).send({ "status": 0, "msg": err.message, "data": null });
        }
        const transformedRows = [];
        for (const row of rows) {
            ffromuid = row.fromuid === uid ? row.touid : row.fromuid
            const username = await getUserName(ffromuid);
            const countsmsg = await noStatusMessageCount(uid, ffromuid)
            transformedRows.push({
                id: row.id,
                fromuid: ffromuid,
                message: row.message,
                time: row.time,
                type: row.type,
                username: username,
                noStatusMessageCount: countsmsg
            });
        }
        return res.send({ "status": 1, "msg": "获取成功", "data": transformedRows });
    });
})





app.get('/api/user/message', (req, res) => {
    const { uid } = req.session;
    const { touser, page, size } = req.query;
    const offset = (page - 1) * size;
    db.all(`SELECT * FROM msgdata WHERE 
    (fromuid = ? AND touid = ?) OR (fromuid = ? AND touid = ?)
    ORDER BY id DESC
    LIMIT ? OFFSET ?`,
        [uid, touser, touser, uid, size, offset], (err, rows) => {
            if (err) {
                return res.status(500).send({ "status": 0, "msg": err.message, "data": null });
            }
            // 将消息状态改为已读
            db.run('UPDATE msgdata SET status = TRUE WHERE fromuid = ? AND touid = ?', [touser, uid], function (err) {
                if (err) {
                    return res.status(500).send({ "status": 0, "msg": err.message, "data": null });
                }
            });
            return res.send({ "status": 1, "msg": "获取成功", "data": rows })
        });

})


app.post('/api/user/sendMessage', (req, res) => {
    const { touser, message, type } = req.body;
    if (!touser || !message || !type) {
        return res.send({ "status": 0, "msg": "参数错误", "data": null })
    }
    const { uid } = req.session;
    db.run('INSERT INTO msgdata (fromuid, touid, message, type) VALUES (?, ?, ?, ?)', [uid, touser, message, type], function (err) {
        if (err) {
            return res.status(500).send({ "status": 0, "msg": err.message, "data": null });
        }
        return res.send({ "status": 1, "msg": "发送成功", "data": null })
    });
});



app.get('/api/user/friendList', (req, res) => {
    const { uid } = req.session;
    // db.all('SELECT * FROM friendlist WHERE uid = ?', [uid], (err, rows) => {
    //     if (err) {
    //         return res.status(500).send({ "status": 0, "msg": err.message, "data": null });
    //     }
    //     return res.send({ "status": 1, "msg": "获取成功", "data": rows })
    // });
    // 查询除自己的users表,只返回uid和username
    db.all('SELECT uid, username FROM users WHERE uid != ?', [uid], (err, rows) => {
        if (err) {
            return res.status(500).send({ "status": 0, "msg": err.message, "data": null });
        }
        return res.send({ "status": 1, "msg": "获取成功", "data": rows })
    });
});


app.get('/api/user/prefile', (req, res) => {
    const { uid } = req.session;
    db.get('SELECT * FROM users WHERE uid = ?', [uid], (err, row) => {
        if (err) {
            return res.status(500).send({ "status": 0, "msg": err.message, "data": null });
        }
        if (!row) {
            return res.send({ "status": 0, "msg": "用户不存在", "data": null })
        }
        return res.send({ "status": 1, "msg": "获取成功", "data": row })
    });
});


const storage = multer.diskStorage({
    destination: '../upfile/image/',
    filename: function (req, file, cb) {
        crypto.randomBytes(16, (err, raw) => {
            if (err) return cb(err);
            // 使用发送人uid-接收人uid-时间戳-8位随机数作为文件名
            cb(null, req.session.uid + '-' + req.query.touid + '-' + Date.now() + '-' + raw.toString('hex') + path.extname(file.originalname));
            // cb(null, raw.toString('hex') + Date.now() + path.extname(file.originalname));
        });
    }
});

const upload = multer({ storage: storage });

// 设置路由
app.post('/api/user/upload/image', upload.single('image'), (req, res) => {
    // 如果上传成功，Multer 会将文件信息保存在 req.file 中
    if (!req.file) {
        return res.status(400).send('未选择文件');
    }

    // 在这里可以对上传的文件进行处理
    // 例如返回上传成功的信息
    res.send({ "status": 1, "msg": "上传成功", "data": req.file.filename });
});

app.post('/api/forgotPassword', (req, res) => {
    const { uid, username } = req.session;
    const { password } = req.body;
    if (!password) {
        return res.send({ "status": 0, "msg": "参数错误", "data": null })
    }
    db.run('UPDATE users SET password = ? WHERE uid = ? AND username = ?', [password, uid, username], function (err) {
        if (err) {
            return res.status(500).send({ "status": 0, "msg": err.message, "data": null });
        }
        return res.send({ "status": 1, "msg": "修改成功", "data": null })
    });
});

app.get('/api/user/getWSToken', (req, res) => {
    const { uid, username } = req.session;
    const token = Math.random().toString(36).substr(2, 9);
    db.run('INSERT INTO wstoken (uid, token, username) VALUES (?, ?, ?)', [uid, token, username], function (err) {
        if (err) {
            return res.status(500).send({ "status": 0, "msg": err.message, "data": null });
        }
        return res.send({ "status": 1, "msg": "获取成功", "data": token })
    });
});



const WebSocket = require('ws');
const http = require('http');

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = {};


wss.on('connection', (ws, req) => {
    var onlineUser = ''
    // console.log("客户端发起连接")

    // 获取客户端的token参数
    try {
        var token = req.url.split('?')[1].split('=')[1];
        // var path = req.url.split('?')[0];
    } catch (error) {
        console.log(error);
        return ws.close();
    }
    db.all('SELECT * FROM wstoken WHERE token = ?', [token], (err, rows) => {
        if (err) {
            console.log(err);
            ws.send(JSON.stringify({ "status": 0, "message": "数据库错误", "data": null }));
            return ws.close();
        }
        if (rows.length === 0) {
            console.log('token不存在');
            ws.send(JSON.stringify({ "status": 0, "message": "未登录", "data": null }));
            return ws.close();
        }
        ws.id = rows[0].uid;
        onlineUser = rows[0].username
        console.log('用户' + onlineUser + '连接成功');
        clients[ws.id] = ws;
        // 广播用户上线
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ "status": 1, "message": "成功", "data": { "uid": ws.id, "name": onlineUser }, "type": 4, "userStatus": 1 }));
            }
        });
        // console.log('连接成功');
    });
    // 向客户端发送在线用户列表
    ws.send(JSON.stringify({ "status": 1, "message": "成功", "data": Object.keys(clients), "type": 3 }));
    ws.on('message', message => {
        // console.log('接收到消息', message.toString());
        if (message.toString() === 'ping') return ws.send('pong');
        // 将消息发送给其他客户端
        let msgData = JSON.parse(message); // Use let to declare msgData
        msgData['from'] = ws.id;
        // type 1: 文字消息 2: 消息已读通知
        // 客户端发送消息已读
        if (msgData['rawtype'] == 2) {
            db.run('UPDATE msgdata SET status = TRUE WHERE fromuid = ? AND touid = ?', [msgData.fromuid, msgData.from], function (err) {
                if (err) {
                    return ws.send(JSON.stringify({ "status": 0, "msg": err.message, "data": null }));
                }
                return ws.send(JSON.stringify({ "status": 1, "msg": "成功", "data": null }))
            });
        }
        if (msgData['rawtype'] == 1) {
            var userStatus = 0
            msgData['time'] = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds()
            if (msgData['touser'] in clients) {
                console.log("对方在线")
                userStatus = 1
                msgData['fromuid'] = msgData.from
                clients[msgData['touser']].send(JSON.stringify({ "status": 1, "message": "成功", "data": msgData, "type": 1 }));
            } else {
                console.log("对方不在线")
            }
            if (!ws.id || !msgData.touser || !msgData.message || !msgData.type) { 
                return ws.send(JSON.stringify({ "status": 0, "msg": "参数错误", "data": null }))
            }
            db.run('INSERT INTO msgdata (fromuid, touid, message, type) VALUES (?, ?, ?, ?)', [ws.id, msgData.touser, msgData.message, msgData.type], function (err) {
                if (err) {
                    return ws.send(JSON.stringify({ "status": 0, "msg": err.message, "data": null }));
                }
                console.log("消息保存成功")
                console.log(msgData)
                return ws.send(JSON.stringify({ "status": 1, "msg": "发送成功", "data": msgData, "type": 2 }))
            });
        }
        if (msgData['rawtype'] == 3) {
            // 客户端获取在线用户列表
            ws.send(JSON.stringify({ "status": 1, "message": "成功", "data": Object.keys(clients), "type": 3 }));
        }
        // ws.send('服务器已收到消息');
    });
    // 当客户端关闭连接时，将其从连接池中移除
    ws.on('close', () => {
        clearInterval(interval);
        console.log('连接关闭');
        delete clients[ws.id];
        // 广播用户下线
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ "status": 1, "message": "成功", "data": { "uid": ws.id, "name": onlineUser }, "type": 4, "userStatus": 0 }));
            }
        });
    });
    // 每隔30秒向客户端发送ping消息，如果客户端在60秒内没有响应，则关闭连接
    ws.isAlive = true;
    ws.on('pong', () => {
        ws.isAlive = true;
    });
    const interval = setInterval(() => {
        wss.clients.forEach(ws => {
            if (ws.isAlive === false) {
                console.log('连接关闭');
                delete clients[ws.id];
                // 广播用户下线
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ "status": 1, "message": "成功", "data": { "uid": ws.id, "name": onlineUser }, "type": 4, "userStatus": 0 }));
                    }
                });
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping(() => { });
        });
    }, 30000);

});

// 测试错误处理中间件
app.get('/api/error', (req, res) => { 
    throw new Error('服务器错误');
});



// 错误处理中间件
app.use((err, req, res, next) => {
    // console.error(err.stack);
    res.status(500).send({ "status": 0, "msg": err.message, "data": null });
});
// 404 中间件
app.use((req, res) => {
    res.status(404).send({ "status": 0, "msg": "404 Not Found", "data": null });
});

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});