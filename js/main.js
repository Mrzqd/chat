
var sendMsgToUid = "";
function initindex(activeNode) {
    var active = document.querySelector('.active');
    active.classList.remove('active');
    var activeNode = document.getElementById(activeNode);
    activeNode.classList.add('active');
    var msgList = document.querySelector('.msgListBox');
    msgList.innerHTML = ""
    try {
        clearInterval(updateMsgListTimer)
    } catch {
        console.log("没有定时器")
    }
}


function showMessageList() {
    var msgList = document.querySelector('.msgListBox');
    console.log(msgList)
    // 给magList添加监听事件，当子元素发生改变时，将子元素按照data-lasttime排序
    msgList.addEventListener('DOMNodeInserted', function (e) {
        // console.log(e.target)
        // console.log(e.target.getAttribute("data-lasttime"))

        // 获取所有子元素
        var msgListBoxItem = document.querySelectorAll('.msgListBoxItem');
        // console.log(msgListBoxItem)
        // 将子元素按照data-lasttime排序
        var msgListBoxItemArray = Array.prototype.slice.call(msgListBoxItem);
        // console.log(msgListBoxItemArray)
        msgListBoxItemArray.sort(function (a, b) {
            return b.getAttribute("data-lasttime") - a.getAttribute("data-lasttime");
        });
    }
    );
    initindex("messageListIcon");
    // 向div写入html
    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    };
    lastMessageUrl = "/api/user/messageLastList"
    fetch(lastMessageUrl, options)
        .then(response => {
            console.log(response.status)
            if (response.status == 401) {
                // 重定向到登录页面
                return window.location.href = 'login.html';
            }
            return response.json();
        })
        .then((lastMessage) => {
            // console.log(lastMessage)
            for (let i = 0; i < lastMessage.data.length; i++) {
                userData = lastMessage.data[i]
                // console.log(userData)
                if (userData.noStatusMessageCount == 0) {
                    msgList.innerHTML += `
                    <div class="msgListBoxItem" onclick="showUidMessage(${userData.fromuid},'${userData.username}')" data-touid=${userData.fromuid} data-touidMsgId=${userData.id} data-touidMsgNoStatusMessageCount=${userData.noStatusMessageCount} data-lasttime=${userData.time}>
                    <div class="left">
                        <img src="https://xxu.zcbz.online/image/1698998253056_photo_2023-10-20_13-56-46.jpg" alt="" class="user-avatar">
                    </div>
                    <div class="right">
                        <div class="right-up">
                        <div class="username">${userData.username}</div>
                        <div class="lasttime">${userData.time}</div>
                        </div>
                        <div class="right-down">
                        <div class="lastmessage">${userData.message}</div>
                        </div>
                        </div>
                    </div>`
                } else {
                    msgList.innerHTML += `
            <div class="msgListBoxItem" onclick="showUidMessage(${userData.fromuid},'${userData.username}')" data-touid=${userData.fromuid} data-touidMsgId=${userData.id} data-touidMsgNoStatusMessageCount=${userData.noStatusMessageCount} data-lasttime=${userData.time}>
            <div class="left">
                <img src="https://xxu.zcbz.online/image/1698998253056_photo_2023-10-20_13-56-46.jpg" alt="" class="user-avatar">
            </div>
            <div class="right">
                <div class="right-up">
                <div class="username">${userData.username}</div>
                <div class="lasttime">${userData.time}</div>
                </div>
                <div class="right-down">
                <div class="lastmessage">${userData.message}</div>
                <div class="false-count"><span>${userData.noStatusMessageCount}</span></div>
                </div>
                </div>
            </div>`
                }
            }
        })
        .catch((error, status) => {
            console.log(status)
            // 如果状态码为401，跳转到登录页面
            // alert("网络请求失败")
            // window.location.href = 'login.html';
            // 
        })
    updateMsgListTimer = setInterval(() => {
        fetch(lastMessageUrl, options)
            .then(response => response.json())
            .then((lastMessage) => {
                // console.log(lastMessage)
                for (let i = 0; i < lastMessage.data.length; i++) {
                    // 判断是否需要更新
                    userData = lastMessage.data[i]
                    nowMessageNode = document.querySelector(`[data-touid="${userData.fromuid}"]`)
                    if (nowMessageNode) {
                        // 判断data-touidMsgId是否相同
                        if (nowMessageNode.getAttribute("data-touidMsgId") == userData.id) {
                            // 判断消息是否已读
                            if (nowMessageNode.getAttribute("data-touidMsgNoStatusMessageCount") == userData.noStatusMessageCount) {
                                // 不需要更新
                                continue
                            } else {
                                console.log("未读消息数量不相同")
                            }
                        } else {
                            console.log("touidMsgId不相同")
                        }
                        console.log("需要更新")
                        // 删除原来的节点
                        nowMessageNode.remove()
                        if (userData.noStatusMessageCount == 0) {
                            msgList.innerHTML = `
                            <div class="msgListBoxItem" onclick="showUidMessage(${userData.fromuid},'${userData.username}')" data-touid=${userData.fromuid} data-touidMsgId=${userData.id} data-touidMsgNoStatusMessageCount=${userData.noStatusMessageCount} data-lasttime=${userData.time}>
                            <div class="left">
                                <img src="https://xxu.zcbz.online/image/1698998253056_photo_2023-10-20_13-56-46.jpg" alt="" class="user-avatar">
                            </div>
                            <div class="right">
                                <div class="right-up">
                                <div class="username">${userData.username}</div>
                                <div class="lasttime">${userData.time}</div>
                                </div>
                                <div class="right-down">
                                <div class="lastmessage">${userData.message}</div>
                                </div>
                                </div>
                            </div>` + msgList.innerHTML
                        } else {
                            msgList.innerHTML = `
                    <div class="msgListBoxItem" onclick="showUidMessage(${userData.fromuid},'${userData.username}')" data-touid=${userData.fromuid} data-touidMsgId=${userData.id} data-touidMsgNoStatusMessageCount=${userData.noStatusMessageCount} data-lasttime=${userData.time}>
                    <div class="left">
                        <img src="https://xxu.zcbz.online/image/1698998253056_photo_2023-10-20_13-56-46.jpg" alt="" class="user-avatar">
                    </div>
                    <div class="right">
                        <div class="right-up">
                        <div class="username">${userData.username}</div>
                        <div class="lasttime">${userData.time}</div>
                        </div>
                        <div class="right-down">
                        <div class="lastmessage">${userData.message}</div>
                        <div class="false-count"><span>${userData.noStatusMessageCount}</span></div>
                        </div>
                        </div>
                    </div>`+ msgList.innerHTML
                        }
                    }

                }
            })
    }, 1000);
}


function showFriendList() {
    initindex("friendListIcon");
    var msgList = document.querySelector('.msgListBox');
    // 向div写入html
    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    };
    fetch("/api/user/friendList", options)
        .then(response => response.json())
        .then((friendList) => {
            for (let i = 0; i < friendList.data.length; i++) {
                msgList.innerHTML += `
                <div class="msgListBoxItem" onclick="showUidMessage(${friendList.data[i].uid},'${friendList.data[i].username}')">
                    <div class="left">
                        <img src="https://xxu.zcbz.online/image/1698998253056_photo_2023-10-20_13-56-46.jpg" alt="" class="user-avatar">
                    </div>
                    <div class="right">
                        <div class="username">${friendList.data[i].username}</div>
                        <div class="lastmessage">[在线]</div>
                    </div>
                </div>
                `
            }
        })
    // updateMsgListTimer = setInterval(() => {
    //     showFriendList();
    // }, 1000);
}


function emtyMsgBox() {
    var msgList = document.querySelector('.msgBox');
    // 向div写入html
    msgList.innerHTML = ""
}

function showUidMessage(uid, username, page = 1) {
    // 清除定时器
    try {
        clearInterval(geNewMessageTimer)
    } catch {
        console.log("没有定时器")
    }
    emtyMsgBox()
    // 获取消息
    var msgList = document.querySelector('.msgBox');
    msgList.innerHTML = `
    <div class="msgBoxTitle"><span>${username}</span></div>
    <div class="msgContent"></div>
    <div class="msgInput">                <div class="msgInput-product">
    <div class="msgInput-product-item" onclick="showEmoji()">
        <span class="iconfont icon-xiaolian">
        <div class="EmojiList"></div>
        </span>
    </div>
    <div class="msgInput-product-item" onclick="upFileImage('${uid}')">
        <span class="iconfont icon-tupian"></span>
    </div>
</div><div contenteditable="true" id="messageText"></div><button onclick="sendMessage('${uid}')">发送</button></div>

`
    sendMsgToUid = uid
    msgContent = document.querySelector('.msgContent')
    // 向div写入html
    getUidMessageUrl = `/api/user/message?touser=${uid}&page=${page}&size=10`
    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
    };
    fetch(getUidMessageUrl, options)
        .then(response => response.json())
        .then((message) => {
            if (!message.status) {
                alert(message.message)
            }
            for (let i = 0; i < message.data.length; i++) {
                if (message.data[i].fromuid == uid) {
                    if (message.data[i].type == "image") {
                        msgContent.innerHTML += `                
                        <div class="msgContentItemLeft" data-messageid=${message.data[i].id}>
                        <img src="./image/logo_01.png" alt="">
                        <div class="msgBoxItem" onclick="showMsgImageLagre('${message.data[i].message}')">
                            <img src="${message.data[i].message}"
                                alt="" class="msgImage">
                        </div>
                    </div>`
                    } else {
                        msgContent.innerHTML += `
                        <div class="msgContentItemLeft" data-messageID=${message.data[i].id}>
                            <img src="./image/logo_01.png" alt="">
                            <span class="leftMsgSpan">${message.data[i].message}</span>
                        </div>`
                    }
                } else {
                    if (message.data[i].type == "image") {
                        msgContent.innerHTML += `                
                        <div class="msgContentItemRight" data-messageid=${message.data[i].id}>
                        <img src="./image/1698998253056_photo_2023-10-20_13-56-46.jpg" alt="">
                        <div class="msgBoxItem" onclick="showMsgImageLagre('${message.data[i].message}')">
                            <img src="${message.data[i].message}"
                                alt="" class="msgImage">
                        </div>
                    </div>`
                    } else {
                        msgContent.innerHTML += `
                        <div class="msgContentItemRight" data-messageID=${message.data[i].id}>
                            <img src="./image/1698998253056_photo_2023-10-20_13-56-46.jpg" alt="">
                            <span class="rightMsgSpan">${message.data[i].message}</span>
                        </div>`
                    }
                }
            }
        })
    getNewMessageUrl = `/api/user/message?touser=${uid}&page=${page}&size=5`
    geNewMessageTimer = setInterval(() => {
        msgContent = document.querySelector('.msgContent')
        fetch(getNewMessageUrl, options)
            .then(response => response.json())
            .then((message) => {
                if (!message.status) {
                    alert(message.message)
                }
                for (let i = 0; i < message.data.length; i++) {
                    nowMessageNode = document.querySelector(`[data-messageID="${message.data[i].id}"]`)
                    if (nowMessageNode) {
                        continue
                    }
                    console.log("获取到新消息")
                    console.log(message.data[i])
                    if (message.data[i].fromuid == uid) {
                        if (message.data[i].type == "image") {
                            msgContent.innerHTML = `                
                            <div class="msgContentItemLeft" data-messageid=${message.data[i].id}>
                            <img src="./image/logo_01.png" alt="">
                            <div class="msgBoxItem" onclick="showMsgImageLagre('${message.data[i].message}')">
                                <img src="${message.data[i].message}"
                                    alt="" class="msgImage">
                            </div>
                        </div>` + msgContent.innerHTML
                        } else {
                            msgContent.innerHTML = `
                            <div class="msgContentItemLeft" data-messageID=${message.data[i].id}>
                                <img src="./image/logo_01.png" alt="">
                                <span class="leftMsgSpan">${message.data[i].message}</span>
                            </div>` + msgContent.innerHTML
                        }
                    } else {
                        if (message.data[i].type == "image") {
                            msgContent.innerHTML = `                
                            <div class="msgContentItemRight" data-messageid=${message.data[i].id}>
                            <img src="./image/1698998253056_photo_2023-10-20_13-56-46.jpg" alt="">
                            <div class="msgBoxItem" onclick="showMsgImageLagre('${message.data[i].message}')">
                                <img src="${message.data[i].message}"
                                    alt="" class="msgImage">
                            </div>
                        </div>` + msgContent.innerHTML
                        } else {
                            msgContent.innerHTML = `
                            <div class="msgContentItemRight" data-messageID=${message.data[i].id}>
                                <img src="./image/1698998253056_photo_2023-10-20_13-56-46.jpg" alt="">
                                <span class="rightMsgSpan">${message.data[i].message}</span>
                            </div>` + msgContent.innerHTML
                        }
                    }
                    msgContent.scrollTop = msgContent.scrollHeight;
                    console.log(msgContent)
                }
            })
    }, 500);

}

function sendMessage(uid) {
    var messageTextNode = document.getElementById("messageText")
    if (messageText.innerHTML == "") {
        alert("消息不能为空")
        return
    }
    imgList = messageTextNode.querySelectorAll("img")
    for (let i = 0; i < imgList.length; i++) { 
        var img = imgList[i];
        var src = img.src;
        var base64ImageContent = src.replace(/^data:image\/(png|jpg);base64,/, "");
        // 转为Blob对象
        var blob = base64ToBlob(base64ImageContent, 'image/png');
        sendImageMessage(uid,blob)
    }
    messageText = messageTextNode.innerText
    sendMessageUrl = `/api/user/sendMessage`
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            touser: String(uid),
            message: messageText,
            type: "text"
        })
    };
    fetch(sendMessageUrl, options)
        .then(response => response.json())
        .then((message) => {
            if (!message.status) {
                alert(message.message)
            } else {
                // 清空输入框
                document.getElementById("messageText").innerHTML = "";
            }
        })
}


function showMsgImageLagre(imageUrl) {
    msgImageLagreNode = document.querySelector('.msgImageLagre')
    msgImageLagreNode.style.display = 'flex';
    msgImageLagreNode.querySelector('img').src = imageUrl;

}
function hideMsgImageLagre() {
    document.querySelector('.msgImageLagre').style.display = 'none';
}

function showEmoji() {
    alert("开发中...")
}

function upFileImage(uid) {
    // 上传图片
    // 创建一个 input 元素
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.addEventListener('change', function (event) {
        var file = event.target.files[0];
        sendImageMessage(uid, file)
    });
    input.click();
}


function sendImageMessage(uid, file) { 
    var formData = new FormData();
        formData.append('image', file);

        fetch('/api/user/upload/image?touid=' + uid, {
            method: 'POST',
            body: formData,
        })
            .then(response => {
                if (response.ok) {
                    return response.text();
                }
                throw new Error('上传失败');
            })
            .then(filedata => {
                console.log('上传成功！服务器响应:', filedata);
                filedata = JSON.parse(filedata)
                options = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        touser: String(uid),
                        message: currentURL = window.location.protocol + '//' + window.location.host + '/upfile/image/' + filedata.data,
                        type: "image"
                    })
                }
                console.log(options)
                fetch("/api/user/sendMessage", options)
                    .then(response => response.json())
                    .then((message) => {
                        if (!message.status) {
                            alert(message.message)
                        } else {
                            // 清空输入框
                            document.getElementById("messageText").value = "";
                        }
                    })
                    .catch(error => {
                        console.error('上传失败:', error);
                        alert("上传失败")
                    });
            })
            .catch(error => {
                console.error('上传失败:', error);
            });
}

function showLogoutTip() {
    document.querySelector('.logoutTip').style.display = 'flex';
}

function hideLogoutTip() {
    document.querySelector('.logoutTip').style.display = 'none';
}

function logout() {
    // 退出登录
    console.log("退出登录")
    logoutUrl = `/api/user/logout`
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    };
    fetch(logoutUrl, options)
        .then(response => response.json())
        .then((message) => {
            if (!message.status) {
                alert(message.message)
            } else {
                // 清空输入框
                window.location.href = 'login.html';
            }
        })
}

function showEmoji() {
    var emojiList = document.querySelector('.EmojiList');
    emojiList.innerHTML = emojyList
    emojiList.style.display = 'flex';
}
function clickEmojy(emojiuid) {
    var div = document.getElementById("messageText")
    div.innerHTML += `&#${emojiuid};`
}

function showWelcomeTip() {
    firstImg = document.createElement("img");
    firstImg.src = "./image/welcome.png";
    firstImg.className = "welcomeImg";
    document.body.appendChild(firstImg);
    setTimeout(() => {
        firstImg.remove()
    }, 50000);
}

/**
 * base64转blob
 * @param {*} b64Data 
 * @param {*} contentType 
 * @param {*} sliceSize 
 * @returns 
 */
function base64ToBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;
    var byteCharacters = atob(b64Data);
    var byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        var byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    var blob = new Blob(byteArrays, { type: contentType });
    return blob;
}