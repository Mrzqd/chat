async function indexlogin(name, pwd, code) {
    pwd = md5(pwd)
    console.log(name, pwd)
    let data = {
        "username": name,
        "password": pwd,
        "captcha": code
    }
    let request = await fetch(path + "/api/login", {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            'content-type': 'application/json'
        }
    })
    let response = await request.json()
    console.log(response)
    if (response.status == 1) {
        return { "status": 1, "msg": "登录成功" }
    } else {
        console.log("登录失败")
        return response
    }
}

async function getCode1() {
    var url = path + "/api/verify?t=" + new Date().getTime();
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = "blob";
    xhr.onload = function () {
        if (this.status === 200) {
            var res = this.response;
            $("#verify-img").attr("src", window.URL.createObjectURL(res));
        }
    };
    xhr.send();
}

function pwd_hidden() {
    const eye = document.getElementById("eye")
    const pwd = document.getElementById("pwd")
    if (eye.className == "iconfont icon-biyanjing") {
        eye.className = "iconfont icon-yanjing"
        pwd.type = "text"
    } else {
        eye.className = "iconfont icon-biyanjing"
        pwd.type = "password"
    }
}

function pwd_hidden1() {
    const eye = document.getElementById("eye1")
    const pwd = document.getElementById("againpwd")
    if (eye.className == "iconfont icon-biyanjing") {
        eye.className = "iconfont icon-yanjing"
        pwd.type = "text"
    } else {
        eye.className = "iconfont icon-biyanjing"
        pwd.type = "password"
    }
}

async function login_login() {
    var disableindex = document.querySelector(".disableindex")
    var login_btn = document.querySelector(".login-btn")
    loading()
    var name = $("#name").val();
    var pwd = $("#pwd").val();
    var qq = $("#qq").val();
    var code = $("#verify").val();
    // jqury 获取name为cf-turnstile-response的input标签的值
    // var code = $("input[name='cf-turnstile-response']").val();
    console.log(name, pwd, code)
    login_data = await indexlogin(name, pwd, code)
    disableindex.style.display = "none"
    if (login_data.status == 3) {
        $("#messagebox").css("display", "flex")
        $("#errorMessage").text(login_data.msg)
        setTimeout(() => {
            window.location.href = "./register.html"
        }, 2000)
    }
    if (login_data.status == 1) {
        window.location.href = "./index.html"
    } else {
        getCode1()
        $("#messagebox").css("display", "flex")
        $("#errorMessage").text(login_data.msg)
    }
}

function loading() {
    var disableindex = document.querySelector(".disableindex")
    disableindex.style.display = "grid"
}

function login_qywxlogin() {
    window.location.href = "https://login.work.weixin.qq.com/wwlogin/sso/login/?login_type=CorpApp&appid=ww894e78026ea516d8&redirect_uri=https://xxu.zcbz.online/api/xxxy/book/login&state=STATE&agentid=1000002#wechat_redirect"
}

function login_github() {
    window.location.href = "https://github.com/login/oauth/authorize?client_id=fe47aa4b79e5f1d88f77&redirect_uri=https://xxu.zcbz.online/api/xxxy/book/login/githubcallback"
}
async function getNotice() {
    // 获取当前公告
    let r = await fetch(path + "/api/notice")
    let data = await r.json()
    return data
}


function login_local() {
    window.location.href = "http://192.168.1.2:9090/locallogin/login?redirect_uri=https://xxu.zcbz.online/api/xxxy/book/login/localcallback"
}

function validatePassword(password) {
    // 判断密码长度是否大于8位
    const isLengthValid = password.length > 8;

    // 使用正则表达式检查密码是否包含字母和数字
    const containsLetter = /[a-zA-Z]/.test(password);
    const containsNumber = /\d/.test(password);

    // 返回密码复杂度是否满足要求的布尔值
    return isLengthValid && containsLetter && containsNumber;
}

function register(usertype) {
    var disableindex = document.querySelector(".disableindex")
    loading()
    var pwd = $("#pwd").val();
    var againpwd = $("#againpwd").val();
    if (pwd != againpwd) {
        $("#messagebox").css("display", "flex")
        $("#errorMessage").text("两次密码不一致")
        disableindex.style.display = "none"
        return false
    }
    // 校验密码复杂度
    isvalidatePassword = validatePassword(pwd)
    if (!isvalidatePassword) {
        $("#messagebox").css("display", "flex")
        $("#errorMessage").text("密码长度至少8位,且必须包含字母和数字")
        disableindex.style.display = "none"
        return false
    }
    var code = $("#verify").val();
    // var code = $("input[name='cf-turnstile-response']").val();
    const options = {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            "password": pwd,
            "captcha": code
        })
    };
    if(usertype=="fontpassword"){
        url = "/api/forgotPassword"
    } else {
        url = "/api/register"
    }
    fetch(path + url, options)
        .then(res => res.json()).then(async data => {
            disableindex.style.display = "none"
            console.log(JSON.stringify(data))
            if (data.status == 1) {
                if(usertype=="fontpassword"){
                    alert("success", "重置成功")
                } else {
                    alert("success", "注册成功")
                }
                setTimeout(() => {
                    window.location.href = "./login.html"
                }, 1000);
            } else {
                $("#messagebox").css("display", "flex")
                $("#errorMessage").text(data.msg)
            }
        }).catch(e => {
            alert("error", "出错了，请尝试刷新重试！")
        })
}


function checkQrScan() {
    loginButton = document.querySelector(".login-btn > button")
    timer = setInterval(() => {
        $.ajax({
            url: "/api/qr/comet",
            type: "POST",
            dataType: "json",
            success: function (data) {
                if (data.code) {
                    $(".RegisterShow").css("display", "block");
                    $("#RegisterShowText").text("二维码已过期，请点击刷新");
                    clearInterval(timer);
                    $(".RegisterShow").click(function () {
                        $(".RegisterShow").css("display", "none");
                        $(".registerQr").attr("src", "/api/qr/qrcode?r=" + Math.random());
                        checkQrScan()
                    })
                } else {
                    if (data.data.qrCode.status == 2) {
                        console.log("扫码成功,等待确认中");
                        $(".RegisterShow").css("display", "block");
                        $("#RegisterShowText").text("扫码成功,等待确认中");
                    }
                    if (data.data.qrCode.status == 3) {
                        $(".RegisterShow").css("display", "block");
                        $("#RegisterShowText").text("扫码成功");
                        clearInterval(timer);
                        loginButton.removeAttribute("disabled");
                        loginButton.innerText = "注册";
                        $("#xuehao").css("display", "block");
                        $("#xingming").css("display", "block");
                        $("#xuehao > input").val(data.data.qrCode.uid);
                        $("#xingming > input").val(data.data.qrCode.name);
                        $("#xuehao > input").attr("disabled", "disabled");
                        $("#xingming > input").attr("disabled", "disabled");
                    }
                }
            }
        })
    }, 2000);
}

function LoginCheckQrScan() {
    loginButton = document.querySelector(".login-btn > button")
    timer = setInterval(() => {
        $.ajax({
            url: "/api/qr/comet",
            type: "POST",
            dataType: "json",
            success: function (data) {
                if (data.code) {
                    $(".RegisterShow").css("display", "block");
                    $("#RegisterShowText").text("二维码已过期，请点击刷新");
                    clearInterval(timer);
                    $(".RegisterShow").click(function () {
                        $(".RegisterShow").css("display", "none");
                        $(".registerQr").attr("src", "/api/qr/qrcode?r=" + Math.random());
                        LoginCheckQrScan()
                    })
                } else {
                    if (data.data.qrCode.status == 2) {
                        console.log("扫码成功,等待确认中");
                        $(".RegisterShow").css("display", "block");
                        $("#RegisterShowText").text("扫码成功,等待确认中");
                        loginButton.innerText = "扫码成功,等待确认中"
                    }
                    if (data.data.qrCode.status == 3) {
                        $(".RegisterShow").css("display", "block");
                        $("#RegisterShowText").text("扫码成功");
                        clearInterval(timer);
                        loginButton.removeAttribute("disabled");
                        loginButton.innerText = "登录";
                    }
                }
            }
        })
    }, 2000);
}

function QrLogin() {
    var login_btn = document.querySelector(".login-btn")
    fetch(path + "/api/login", {
        method: 'POST'
    }).then(res => res.json()).then(async login_data => {
        console.log(JSON.stringify(login_data))
        if (login_data.status == 3) {
            $("#messagebox").css("display", "flex")
            $("#errorMessage").text(login_data.msg)
            setTimeout(() => {
                window.location.href = "./register.html"
            }, 2000)
        }
        if (login_data.status == 1) {
            window.location.href = "./index.html"
        } else {
            getCode1()
            $("#messagebox").css("display", "flex")
            $("#errorMessage").text(login_data.msg)
        }
    }).catch(e => {
        console.log(e)
        alert("error", "出错了，请尝试刷新重试！")
    })
}


function selectLoginType(num) {
    console.log(document.querySelector(".select-login-active"))
    document.querySelector(".select-login-active").classList.remove("select-login-active")
    loginButton = document.querySelector(".login-btn > button")
    // 清除input-form下所有内容
    $(".input-form").empty()
    try {
        clearInterval(timer)
    } catch (e) {
        console.log(e)
    }
    if (num == 0) {
        loginButton.innerText = "登录"
        loginButton.setAttribute("onclick", "login_login()")
        // 判断定时器是否存在
        $("#login-type-0").addClass("select-login-active")
        $(".input-form").html(`<div class="input-items" id="messagebox">
        <span class="iconfont icon-cuowu"></span>
        <span id="errorMessage"></span>
    </div>
    <div class="input-items">
        <span class="iconfont icon-yonghu_yonghu"></span>
        <input type="text" placeholder="请输入学号" id="name">
    </div>
    <div class="input-items">
        <span class="iconfont icon-jiesuo"></span>
        <input type="password" placeholder="请输入密码" id="pwd">
        <span id="eye" class="iconfont icon-biyanjing" onclick="pwd_hidden()">
        </span>
    </div>
    <div class="verify">
        <div class="verify-items input-items">
            <span class="iconfont icon-yanzhengma"></span>
            <input type="text" placeholder="请输入验证码" id="verify">
        </div>
        <img src="/api/verify" alt="" id="verify-img" onclick="getCode1()">
    </div>
    <!-- <div class="cf-turnstile" data-sitekey="0x4AAAAAAANxKDoEp0TUq117" data-callback="javascriptCallback"></div> -->`)
    } else {
        $("#login-type-1").addClass("select-login-active")
        // 将loginButton的onclick事件改为register()
        loginButton.innerText = "未扫码"
        loginButton.setAttribute("onclick", "QrLogin()")
        $(".input-form").html(`<div class="input-items" id="messagebox">
        <span class="iconfont icon-cuowu"></span>
        <span id="errorMessage"></span>
    </div>
        <div class="input-item">
        <div class="RegisterContent">
            <span>请使用新乡学院APP扫描二维码</span>
            <img src="/api/qr/qrcode" alt="" class="registerQr">
            <div class="RegisterShow">
                <span id="RegisterShowText"></span>
            </div>
        </div>
    </div>
        `)
        LoginCheckQrScan()
    }
}

function forgotPasswd() {
    window.location.href = "./fontpassword.html"
}

function registerJump() {
    window.location.href = "./register.html"
}