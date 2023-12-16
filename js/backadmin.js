
var path = ""


function showMenu() {
$(".admin-left").css("display", "flex")
}

function hideMenu() {
$(".admin-left").css("display", "none")
}

function showNotice() {
    // 创建一个div+input用来显示公告
    $.get({
        url: path + "/api/xxxy/book/notice",
        success: function (data) {
            if (data.code == 200) {
                var div = document.createElement("div")
                div.className = "notice"
                var input = document.createElement("input")
                input.className = "notice-input"
                input.value = data.data
                div.appendChild(input)
                document.body.appendChild(div)
            }
        }
    })
}


async function showUserList() {
    // 判断页面是否为空
    emptyContent()
    // 显示用户列表
    $.get({
        url: path + "/api/xxxy/book/alluser",
        success: async function (data) {
            if (data.status == 1) {
                // 使用jquery创建表格,并添加到class为content的div中
                var table = $("<table></table>")
                table.addClass("user-table")
                var tr = $("<tr></tr>")
                var th1 = $("<th></th>")
                th1.text("姓名")
                var th2 = $("<th></th>")
                th2.text("学院")
                var th3 = $("<th></th>")
                th3.text("学号")
                var th4 = $("<th></th>")
                th4.text("QQ")
                var th5 = $("<th></th>")
                th5.text("创建时间")
                var th6 = $("<th></th>")
                th6.text("更新时间")
                var th7 = $("<th></th>")
                th7.text("操作")
                tr.append(th1, th2, th3, th4, th5, th6, th7)
                table.append(tr)
                $(".content").append(table)
                for (var i = 0; i < data.data.length; i++) {
                    userinfo = data.data[i].value
                    // 将字符串格式化为json
                    userinfo = JSON.parse(userinfo)
                    userid = userinfo.info
                    userData = await getUserDetail(userid)
                    userData = userData.data.list
                    // 使用jquery创建tr
                    var tr = $("<tr></tr>")
                    var td1 = $("<td></td>")
                    td1.text(userData.name)
                    var td2 = $("<td></td>")
                    td2.text(userData.deptName)
                    var td3 = $("<td></td>")
                    td3.text(userData.id)
                    var td4 = $("<td></td>")
                    td4.text(userData.qq)
                    var td5 = $("<td></td>")
                    td5.text(data.data[i].createdAt)
                    var td6 = $("<td></td>")
                    td6.text(data.data[i].updatedAt)
                    var td7 = $("<td></td>")
                    button = $("<button></button>")
                    if (data.data[i].status == 0) {
                        button.text("关闭")
                        button.attr("onclick", `choseStatus('disable',${userData.qq})`)
                    } else {
                        button.text("开启")
                        button.attr("onclick", `choseStatus('enable',${userData.qq})`)
                    }
                    td7.append(button)
                    button1 = $("<button></button>")
                    button1.text("删除")
                    button1.attr("onclick", `autoDelete(${userData.qq})`)
                    td7.append(button1)
                    tr.append(td1, td2, td3, td4, td5, td6, td7)
                    $(".user-table").append(tr)
                }
            }
        }
    })
}

function emptyContent() {
    if ($(".content").children().length != 0) {
        $(".content").empty()
    }
}

async function getUserDetail(userid) {
    // 获取用户详细信息
    pwd = md5(userid)
    console.log(userid, pwd)
    var formData = new FormData();
    formData.append("username", userid);
    formData.append("password", pwd);
    formData.append("from", "mobile");
    let request = await fetch(path + "/api/xxxy/booking/login", {
        method: 'POST',
        body: formData,
    })
    let response = await request.json()
    console.log(response)
    return response
}


function showNotice() {
    emptyContent()
    var div = $("<div></div>")
    div.addClass("notice")
    var textarea  = $("<textarea ></textarea>")
    textarea.addClass("notice-textarea")
    // 创键提交按钮
    var button = $("<button></button>")
    button.text("提交")
    button.addClass("notice-button")
    button.click(function () {
        // 提交公告
        $.post({
            url: path + "/api/xxxy/book/notice",
            data: {
                notice: $(".notice-textarea").val()
            },
            success: function (data) {
                if (data.status == 1) {
                    alert("提交成功")
                } else {
                    alert(data.msg)
                }
            }
        })
    })
    div.append(textarea)
    div.append(button)

    $(".content").append(div)
    $.get({
        url: path + "/api/xxxy/book/notice",
        success: function (data) {
            if (data.status == 1) {
                $(".notice-textarea ").val(data.data)
            }
        }
    })
}

function nowLoginStatus() {
    $.get({
        url: path + "/api/xxxy/book/nowlogin",
        success: function (data) {
            if (data.status == 1) {
                console.log("当前已登录")
            } else {
                console.log("当前未登录")
                window.location.href = "/login.html"
            }
        },
        error: function () {
            console.log("当前未登录")
            window.location.href = "/login.html"
        }
    })
}
nowLoginStatus()


function showlogs() {
    emptyContent()
    $.get({
        url: path + "/api/xxxy/book/autobooking/log/list",
        success: function (data) {
            console.log(data)
            if (data.status == 1) {
                var div = $("<div></div>")
                div.addClass("logs")
                for (var i = 0; i < data.data.length; i++) {
                    var li = $("<li></li>")
                    li.addClass("loglist")
                    li.text(data.data[i].filename)
                    li.click(function () {
                        console.log(`点击了${$(this).text()}`)
                        $.get({
                            url: path + "/api/xxxy/book/autobooking/log/content?filename=" + $(this).text(),
                            success: function (data) {
                                if (data.status == 1) {
                                    // 写一个三段式弹窗
                                    var div = $("<div></div>")
                                    div.addClass("log-content")
                                    var header = $("<div></div>")
                                    header.addClass("log-header")
                                    var span = $("<span></span>")
                                    span.addClass("log-span")
                                    span.text("日志内容")
                                    header.append(span)
                                    div.append(header)
                                    var log_content = $("<div></div>")
                                    log_content.addClass("logcontent")
                                    var pre = $("<pre></pre>")
                                    pre.addClass("log-pre")
                                    pre.html(data.data)
                                    log_content.append(pre)
                                    div.append(log_content)
                                    var button = $("<button></button>")
                                    button.addClass("log-close")
                                    button.text("关闭")
                                    button.click(function () {
                                        $(".log-content").remove()
                                    })
                                    div.append(button)
                                    $("body").append(div)
                                }
                            }
                        })
                        // 创建一个弹窗，右上角放一个关闭按钮


                    })
                    div.append(li)
                }
                $(".content").append(div)
            }
        }
    })
}


// 将\n替换成<br>
function replaceBr(str) {
    return str.replace(/\n/g, "<br>")
}


function showWebConfig() {
    emptyContent()
    var div = $("<div></div>")
    div.addClass("webconfig")
    // 创建一个编辑框
    var textheader = $("<div></div>")
    textheader.addClass("webconfig-header")
    var span = $("<span></span>")
    span.text("学号白名单")
    var editor = $("<div></div>")
    editor.addClass("webconfig-editor")
    var textarea = $("<textarea></textarea>")
    // <textarea placeholder="在这里输入内容..."></textarea>
    textarea.attr("placeholder", "在这里输入内容...")
    textarea.addClass("webconfig-textarea")
    $.get({
        url: path + "/api/xxxy/book/autobooking/rule",
        success: function (data) { 
            console.log(data)
            if (data.status == 1) {
                textarea.val(data.data)
            }else{
                textarea.val(data.msg)
            }
        }
    })
    var footer = $("<div></div>")
    footer.addClass("webconfig-footer")
    var button = $("<button></button>")
    button.text("提交")
    button.addClass("webconfig-button")
    button.click(function () {
        // 将$(".webconfig-textarea").val()按照,分割成数组
        allowedRules = $(".webconfig-textarea").val().split(",")
        console.log(allowedRules)
        $.post({
            url: path + "/api/xxxy/book/autobooking/rule",
            dataType: "json",
            async: false,
            contentType: "application/json",
            data: JSON.stringify({"allowedRules": allowedRules}),
            success: function (data) {
                if (data.status == 1) {
                    alert("提交成功")
                } else {
                    alert(data.msg)
                }
            }
        })
    })
    textheader.append(span)
    editor.append(textarea)
    footer.append(button)
    div.append(textheader)
    div.append(editor)
    div.append(footer)
    $(".content").append(div)
}

function showUsers() {
    emptyContent()
    $(".content").html(`
    <div class="user-table">
    <div class="user-table-headers">
        <div>注册用户</div>
        <div>在线用户</div>
    </div>
    <div class="user-table-content">
        <table>
            <tr>
                <th>头像</th>
                <th>学号</th>
                <th>姓名</th>
                <th>性别</th>
                <th>学院</th>
                <th>专业</th>
                <th>班级</th>
                <th>操作</th>
            </tr>
            <tbody id="user-list">
    </tbody>
</table>
</div>
</div>
    `)
    $.get({
        url: path + "/api/xxxy/book/getAllKeys",
        success: function (data) {
            if (data.status == 1) {
                // 从列表中获取长度为11位开头为20的学号
                uiddata = data.data.filter(function (item) {
                    // console.log(item)
                    return item.startsWith("20") && item.length == 11
                })
                console.log(uiddata)
                for (var i = 0; i < uiddata.length; i++) {
                    $.get({
                        url: path + "/api/xxxy/book/getAllKeys?key=" + uiddata[i],
                        success: function (res) { 
                            if (res.status == 1) {
                                data = res.data
                                console.log(data)
                                $("#user-list").append(`
                                <tr>
                                <td><img class="user-list-img" src="${data.userData?data.userData.photo:"/image/logo_01.png"}"></td>
                                <td>${data.list.id}</td>
                                <td>${data.list.name}</td>
                                <td>${data.userData?data.userData.sexValue:"暂未获取"}</td>
                                <td>${data.userData?data.userData.deptName:"暂未获取"}</td>
                                <td>${data.userData?data.userData.majorName:"暂未获取"}</td>
                                <td>${data.userData?data.userData.className:"暂未获取"}</td>
                                <td>删除</td>
                                </tr>`)
                            }
                        }
                    })
                }
            }
        }
    })
}