const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });



const db = new sqlite3.Database('data.db');


const clients = {};

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
                client.send(JSON.stringify({ "status": 1, "message": "成功", "data": {"uid":ws.id,"name":onlineUser}, "type": 4, "userStatus": 1 }));
            }
        });
        console.log('连接成功');
    });
    // 向客户端发送在线用户列表
    ws.send(JSON.stringify({ "status": 1, "message": "成功", "data": Object.keys(clients), "type": 3 }));
    ws.on('message', message => {
        console.log('接收到消息', message.toString());
        if (message.toString() === 'ping') return ws.send('pong');
        // 将消息发送给其他客户端
        let msgData = JSON.parse(message); // Use let to declare msgData
        msgData['from'] = ws.id;
        // type 1: 文字消息 2: 消息已读通知
        // 客户端发送消息已读
        if (msgData['rawtype'] == 2) { 
            db.run('UPDATE msgdata SET status = TRUE WHERE fromuid = ? AND touid = ?', [ msgData.fromuid,msgData.from], function (err) {
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
                client.send(JSON.stringify({ "status": 1, "message": "成功", "data": {"uid":ws.id,"name":onlineUser}, "type": 4, "userStatus": 0 }));
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
                        client.send(JSON.stringify({ "status": 1, "message": "成功", "data": {"uid":ws.id,"name":onlineUser}, "type": 4, "userStatus": 0 }));
                    }
                });
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping(() => { });
        });
    }, 30000);

});


server.listen(18879, () => {
    console.log(`Server started on port 18879`);
});