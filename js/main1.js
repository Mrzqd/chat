
async function login(name, pwd) {
    pwd = md5(pwd)
    console.log(name, pwd)
    var formData = new FormData();
    formData.append("username", name);
    formData.append("password", pwd);
    formData.append("from", "mobile");
    let request = await fetch(path + "/api/xxxy/booking/login", {
        method: 'POST',
        body: formData,
    })
    let response = await request.json()
    console.log(response)
    if (response.status == 1) {
        // localStorage.clear()
        console.log(JSON.stringify(response))
        for (const [k, v] of Object.entries(response.data.list)) {
            localStorage.setItem(k, v)
        }
        for (const [k, v] of Object.entries(response.data._hash_)) {
            localStorage.setItem(k, v)
        }
        return { "status": 1, "msg": "登录成功" }
    } else {
        console.log("登录失败")
        return { "status": 0, "msg": response.msg }
    }
}

async function qqqcheck() {
    let request = await fetch(path + "/api/xxxy/book/qqqstatus?userqq=" + localStorage.getItem("qq"), {
        method: 'GET',
    })
    let response = await request.json()
    if (response.status == 0) {
        console.log("检测到您未加入群聊，请加入群聊已获得最新的通知\n 567111994 ")
        return false
    }
    return true
}

function getInfoList(page = 1) {
    if (page == 1) {
        localStorage.setItem("page", page)
        $("#preInfoButton").css("display", "none")
    } else {
        $("#preInfoButton").css("display", "flex")
    }
    var disableindex = document.querySelector(".disableindex")
    loading()
    $.get({
        async: true,
        cache: false,
        dataType: "json",
        url: path + `/api/xxxy/booking/profile/books?access_token=${localStorage.getItem("access_token")}&userid=${localStorage.getItem("userid")}&count=10&page=${page}`,
        success: async function (data) {
            disableindex.style.display = "none"
            console.log(data)
            if (data.status == 1) {
                console.log(data.data.page * 10)
                if ((data.data.page * 10) > data.data.allpage) {
                    console.log("隐藏")
                    $("#nextInfoButton").css("display", "none")
                } else {
                    $("#nextInfoButton").css("display", "flex")
                }
                rdata = data.data.list
                for (let i = 0; i < rdata.length; i++) {
                    // console.log(rdata[i])
                    // rdata[i].status 2代表已预约，3代表使用中，4代表已使用，6代表已取消，8代表违约，9代表即将开始
                    switch (rdata[i].status) {
                        case 2:
                        case 9:
                            item = `<button onclick="cancel(${rdata[i].id})">取消</button>`
                            break;
                        case 3:
                            // item = `<button onclick="menuLate(${rdata[i].id})">临时离开</button>`
                            // item += `<button onclick="menuCheckOut(${rdata[i].id})">结束使用</button>`
                            item = "使用中"
                            break;
                        default:
                            item = "无法操作"
                            break;
                    }
                    if (rdata[i].status == 2 || rdata[i].status == 9) {
                        item = `<button onclick="cancel(${rdata[i].id})">取消</button>`
                    } else {
                        item = "无法操作"
                    }
                    $(".myinfo-table").append(`<tr><td>${item}</td><td>${rdata[i].spaceDetailInfo.areaInfo.nameMerge}:${rdata[i].spaceDetailInfo.name}</td><td>${rdata[i].beginTime.date}</td><td>${rdata[i].statusName}</td><td>${rdata[i].no}</td></tr>`)
                }
            } else {
                if (data.msg == "没有登录或登录已超时") {
                    login_data = await login(localStorage.getItem("userid"), localStorage.getItem("userid"))
                    if (login_data.status == 1) {
                        getInfoList()
                    } else {
                        window.location.href = "./login.html"
                    }
                }
            }
        },
        error: function (xhr, status, error) {
            console.log(xhr)
            alert("error", status)
            // 处理错误情况
            if (status == 401) {
                const opentype = getUrlParams('opentype');
                console.log(opentype)
                // alert("error",opentype)
                if (opentype == "wxmp") {
                    window.location.href = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxae0c73fdfe1135cf&redirect_uri=https://xxu.zcbz.online/redirect.html&response_type=code&scope=snsapi_userinfo&state=xxxytushuguanyuyue#wechat_redirect"
                }
                // 获取url param
                window.location.href = "./login.html"
            } else {
                alert("error", "出错了,请尝试刷新重试！")
            }
        }
    })
}

function preInfolist() {
    // 清空.myinfo-table
    createInfoTable()
    // 获取当前页数
    var page = localStorage.getItem("page")
    // 转换为int
    page = parseInt(page)
    // 减一
    page = page - 1
    // 重新存入
    localStorage.setItem("page", page)
    // 重新获取
    page = localStorage.getItem("page")
    // 重新获取数据
    getInfoList(page)
}

function nextInfoList() {
    // 清空.myinfo-table的td,不清空th
    createInfoTable()
    // 获取当前页数
    var page = localStorage.getItem("page")
    // 转换为int
    page = parseInt(page)
    // 加一
    page = page + 1
    // 重新存入
    localStorage.setItem("page", page)
    // 重新获取
    page = localStorage.getItem("page")
    // 重新获取数据
    getInfoList(page)
}

function createInfoTable() {
    $(".myinfo-table").empty()
    $(".myinfo-table").append(`<tr><th>操作</th><th>预约空间</th><th>开始时间</th><th>当前状态</th><th>预约号</th></tr>`)
}

function loading() {
    var disableindex = document.querySelector(".disableindex")
    disableindex.style.display = "grid"
}

function booking(id, space_id, day) {
    loading()
    console.log(`你可能需要预约${id},${space_id},${day}`)
    var segment = 0
    if (day == "today") {
        console.log("你选择预约的是今天");
        segment = localStorage.getItem("todaysegment")
    } else if (day == "tomorrow") {
        console.log("你选择预约的是明天");
        segment = localStorage.getItem("tomorrowsegment")
    } else {
        alert("error", "出错了,请尝试刷新重试！")
    }
    var formData = new FormData()
    formData.append("access_token", localStorage.getItem("access_token"))
    formData.append("userid", localStorage.getItem("userid"))
    formData.append("area", id)
    formData.append("segment", segment)
    formData.append("space_id", space_id)
    formData.append("type", 1)

    fetch(path + `/api/xxxy/booking/spaces/${space_id}/book`, {
        method: 'POST',
        body: formData,
    }).then(res => res.json()).then(async data => {
        disableindex.style.display = "none"
        console.log(JSON.stringify(data))
        if (data.status == 1) {
            alert("success", "预约成功")
        } else {
            if (data.msg == "没有登录或登录已超时") {
                console.log("登录失效，正在重新登录")
                login_data = await login(localStorage.getItem("userid"), localStorage.getItem("userid"))
                if (login_data.status == 1) {
                    booking(id, space_id, day)
                } else {
                    alert("error", "登录失效，请重新登录")
                    window.location.href = "./login.html"
                }
            } else {
                alert("error", `${data.msg}\n出错了，请尝试刷新重试！`)
            }
        }
    }).catch(e => {
        alert("error", "出错了,请尝试刷新重试！")
    })
}


function logout() {
    localStorage.clear()
    $.post({
        url: path + "/api/xxxy/book/logout",
        async: true,
        cache: false,
        dataType: "json",
        success: async function (rv) {
            console.log(JSON.stringify(rv))
            if (rv.status == 1) {
                window.location.href = "./login.html"
            } else {
                alert("error", `${rv.msg}\n出错了，请尝试刷新重试！`)
            }
        },
        error: function (xhr, status, error) {
            // 处理错误情况
            if (status == 401) {
                window.location.href = "./login.html"
            } else {
                alert("error", "出错了,请尝试刷新重试！")
            }
        }
    })
}


function myinfo() {
    window.location.href = "./myinfo.html"
}


function backHome() {
    window.location.href = "./index.html"
}

function cancel(id) {
    var formData = new FormData()
    formData.append("access_token", localStorage.getItem("access_token"))
    formData.append("userid", localStorage.getItem("userid"))
    formData.append("id", id)
    formData.append("_method", "delete")
    fetch(path + `/api/xxxy/booking/profile/books/${id}`, {
        method: 'POST',
        body: formData,
    }).then(res => res.json()).then(async data => {
        console.log(JSON.stringify(data))
        if (data.status == 1) {
            alert("success", "取消成功")
            window.location.reload()
        } else {
            if (data.msg == "没有登录或登录已超时") {
                login_data = await login(localStorage.getItem("userid"), localStorage.getItem("userid"))
                if (login_data.status == 1) {
                    cancel(id)
                } else {
                    alert("error", "登录失效，请重新登录")
                    window.location.href = "./login.html"
                }
            } else {
                alert("error", `${data.msg}\n出错了，请尝试刷新重试！`)
            }
        }
    }
    ).catch(e => {
        alert("error", "出错了")
    })
}

async function getInfoAuto() {
    console.log("获取自动预约信息")
    var auto_status = document.querySelector(".auto-status")
    var userqq = localStorage.getItem("qq")
    console.log(userqq)
    if (userqq == null) {
        document.getElementById("area").innerHTML = "未绑定qq"
        document.getElementById("spaceId").innerHTML = "请点击右上角退出登录"
        document.getElementById("autoStatus").innerHTML = "再次登录时绑定qq"
        return false
    }
    document.getElementById("qq").innerHTML = userqq
    $.get({
        url: path + `/api/xxxy/book?userqq=${userqq}`,
        async: true,
        cache: false,
        dataType: "json",
        success: async function (rv) {
            console.log(JSON.stringify(rv))
            if (rv.status == 1) {
                if (rv.data.length == 0) {
                    document.getElementById("area").innerHTML = "未设置"
                    document.getElementById("spaceId").innerHTML = "未设置"
                    document.getElementById("autoStatus").innerHTML = "未设置"
                    return false
                }
                userData = JSON.parse(rv.data[0].value)
                document.getElementById("area").innerHTML = userData.area
                document.getElementById("spaceId").innerHTML = userData.spaceid
                if (rv.data[0].status == 0) {
                    document.getElementById("autoStatus").innerHTML = "已开启"
                    $("#autoButton").append(`<button onclick="choseStatus('disable')">停止</button>`)
                } else {
                    document.getElementById("autoStatus").innerHTML = "已停止"
                    $("#autoButton").append(`<button onclick="choseStatus('enable')">开启</button>`)
                }
                $("#autoButton").append(`<button onclick="autoDelete()">删除</button>`)
            } else {
                alert("error", `${rv.msg}\n出错了，请尝试刷新重试！`)
            }
        },
        error: function (xhr, status, error) {
            // 处理错误情况
            if (status == 401) {
                // 获取url param
                const opentype = getUrlParams('opentype');
                console.log(opentype)
                // alert("error",opentype)
                if (opentype == "wxmp") {
                    window.location.href = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxae0c73fdfe1135cf&redirect_uri=https://xxu.zcbz.online/redirect.html&response_type=code&scope=snsapi_userinfo&state=xxxytushuguanyuyue#wechat_redirect"
                }
                // 获取特定参数的值
                const code = getUrlParams('code'); // 获取 id 参数的值
                const state = getUrlParams('state'); // 获取 name 参数的值
                if (code && state == "xxxytushuguanyuyue") {
                    console.log(code)
                    $.get({
                        url: path + `/api/xxxy/book/wxmplogin?code=${code}`,
                        async: true,
                        cache: false,
                        dataType: "json",
                        success: async function (rv) {
                            console.log(JSON.stringify(rv))
                            if (rv.status == 1) {
                                for (const [k, v] of Object.entries(rv.data.list)) {
                                    localStorage.setItem(k, v)
                                }
                                window.location.href = "./myinfo.html"
                            } else {
                                window.location.href = "./login.html"
                            }
                        },
                        error: function (xhr, status, error) {
                            // 处理错误情况

                            window.location.href = "./login.html"

                        }
                    })
                }
                window.location.href = "./login.html"
                console.log(error)
            } else {
                alert("error", "出错了,请尝试刷新重试！")
            }
        }
    })
    qqqstatus = await qqqcheck()
    if (!qqqstatus) {
        localStorage.clear()
        alert("error", "检测到您未加入群聊，请加入群聊后操作！\n 567111994")
        window.location.href = "./login.html"
        return
    }
}

function choseStatus(status, userqq) {
    if (userqq == null) {
        var userqq = localStorage.getItem("qq")
    }
    if (userqq == null) {
        alert("error", "请先绑定qq")
        return false
    }
    console.log(userqq)
    $.post({
        url: path + `/api/xxxy/book/status?userqq=${userqq}`,
        async: true,
        cache: false,
        dataType: "json",
        data: {
            "chose": status
        },
        success: async function (rv) {
            console.log(JSON.stringify(rv))
            if (rv.status == 1) {
                window.location.reload()
            } else {
                alert("error", `${rv.msg}\n出错了，请尝试刷新重试！`)
            }
        },
        error: function (xhr, status, error) {
            // 处理错误情况
            if (status == 401) {
                window.location.href = "./login.html"
            } else {
                alert("error", "出错了,请尝试刷新重试！")
            }
        }
    })
}

function autoDelete(userqq) {
    if (userqq == null) {
        userqq = localStorage.getItem("qq")
    }
    if (userqq == null) {
        alert("error", "请先绑定qq")
        return false
    }
    console.log(userqq)
    $.post({
        url: path + `/api/xxxy/book/delete?userqq=${userqq}`,
        cache: false,
        dataType: "json",
        success: async function (rv) {
            console.log(JSON.stringify(rv))
            if (rv.status == 1) {
                window.location.reload()
            } else {
                alert("error", `${rv.msg}\n出错了，请尝试刷新重试！`)
            }
        },
        error: function (xhr, status, error) {
            // 处理错误情况
            if (status == 401) {
                window.location.href = "./login.html"
            } else {
                alert("error", "出错了,请尝试刷新重试！")
            }
        }
    })
}

function autobooking(area, space_id) {
    var userqq = localStorage.getItem("qq")
    if (userqq == null) {
        alert("error", "请先绑定qq")
        return false
    }
    var userId = localStorage.getItem("userid")
    var disableindex = document.querySelector(".disableindex")
    loading()
    $.post({
        url: path + `/api/xxxy/book?userqq=${userqq}`,
        cache: false,
        dataType: "json",
        data: {
            "area": area,
            "spaceid": space_id,
            "info": userId
        },
        success: async function (rv) {
            disableindex.style.display = "none"
            console.log(JSON.stringify(rv))
            if (rv.status == 1) {
                alert("success", "设置成功")
                window.location.reload()
            } else {
                alert("error", `${rv.msg}\n出错了，请尝试刷新重试！`)
            }
        },
        error: function (xhr, status, error) {
            // 处理错误情况
            if (status == 401) {
                window.location.href = "./login.html"
            } else {
                alert("error", "出错了，请尝试刷新重试！")
            }
        }
    })
}


// function menuLate(id) {
//     var datas = {
//         '_method': 'leave',
//         'id': id,
//         'userid': localStorage.getItem("userid"),
//         'access_token': localStorage.getItem("access_token"),
//         'operateChannel': 2
//     };
//     var formData = new FormData();
//     for (var key in datas) {
//         formData.append(key, datas[key]);
//     }
//     fetch(path + "/api/xxxy/booking/profile/books/" + id, {
//         method: 'POST',
//         body: formData,
//     }).then(res => res.json()).then(async data => {
//         console.log(JSON.stringify(data))
//         if (data.status == 1) {
//             alert("success", "临时离开成功")
//             window.location.reload()
//         } else {
//             if (data.msg == "没有登录或登录已超时") {
//                 login_data = await login(localStorage.getItem("userid"), localStorage.getItem("userid"))
//                 if (login_data.status == 1) {
//                     menuLate(id)
//                 } else {
//                     alert("error", "登录失效，请重新登录")
//                     window.location.href = "./login.html"
//                 }
//             } else {
//                 alert("error", `${data.msg}\n出错了，请尝试刷新重试！`)
//             }
//         }
//     }
//     ).catch(e => {
//         alert("error", "出错了，请尝试刷新重试！")
//     })
// }

// function menuCheckOut(id) {
//     var datas = {
//         '_method': 'checkout',
//         'id': id,
//         'userid': localStorage.getItem("userid"),
//         'access_token': localStorage.getItem("access_token"),
//         'operateChannel': 2
//     };
//     var formData = new FormData();
//     for (var key in datas) {
//         formData.append(key, datas[key]);
//     }
//     fetch(path + "/api/xxxy/booking/profile/books/" + id, {
//         method: 'POST',
//         body: formData,
//     }).then(res => res.json()).then(async data => {
//         console.log(JSON.stringify(data))
//         if (data.status == 1) {
//             alert("success", "临时离开成功")
//             window.location.reload()
//         } else {
//             if (data.msg == "没有登录或登录已超时") {
//                 login_data = await login(localStorage.getItem("userid"), localStorage.getItem("userid"))
//                 if (login_data.status == 1) {
//                     menuCheckOut(id)
//                 } else {
//                     alert("error", "登录失效，请重新登录")
//                     window.location.href = "./login.html"
//                 }
//             } else {
//                 alert("error", `${data.msg}\n出错了，请尝试刷新重试！`)
//             }
//         }
//     }
//     ).catch(e => {
//         alert("error", "出错了，请尝试刷新重试！")
//     })
// }


function showReneges() {
    fetch(path + `/api/xxxy/booking/profile/reneges?access_token=${localStorage.getItem("access_token")}&userid=${localStorage.getItem("userid")}`)
        .then(response => response.json())
        .then(async response => {
            console.log(response)
            if (response.status == 1) {
                // var 
                if (response.data.list) {
                    //     <div class="renegeList">
                    //     <div class="renegeListHeaders">
                    //       <span>违约记录</span>
                    //       <div onclick="renegeListClose()">×</div>
                    //     </div>
                    //     <div class="renegeListItem" onclick="showDelite()">
                    //       <div class="renegeListItemTop">
                    //         <span>违约时间</span>
                    //         <span class="renegeListRed">2021-10-10 10:10:10</span>
                    //       </div>
                    //       <div class="renegeListItemBottom">
                    //         <div class="renegeListItemBottomContent">
                    //           <span class="font-09-em">违约原因</span>
                    //           <span class="renegeListRed font-09-em">临时离开未签离</span>
                    //         </div>
                    //         <div class="renegeListTip">图书馆-三楼-C(工业书库)区:126</div>
                    //       </div>
                    //     </div>
                    //   </div>
                    var renegeList = document.createElement("div")
                    renegeList.classList.add("renegeList")
                    var renegeListHeaders = document.createElement("div")
                    renegeListHeaders.classList.add("renegeListHeaders")
                    var span = document.createElement("span")
                    span.innerText = "违约记录"
                    var div = document.createElement("div")
                    div.innerText = "×"
                    div.onclick = function () {
                        renegeList.style.display = "none"
                    }
                    renegeListHeaders.appendChild(span)
                    renegeListHeaders.appendChild(div)
                    renegeList.appendChild(renegeListHeaders)
                    for (let i = 0; i < response.data.list.length; i++) {
                        var renegeListItem = document.createElement("div")
                        renegeListItem.classList.add("renegeListItem")
                        var renegeListItemTop = document.createElement("div")
                        renegeListItemTop.classList.add("renegeListItemTop")
                        var span = document.createElement("span")
                        span.innerText = "违约时间"
                        renegeListItemTop.appendChild(span)
                        var span = document.createElement("span")
                        span.classList.add("renegeListRed")
                        span.innerText = response.data.list[i].renegeTime
                        renegeListItemTop.appendChild(span)
                        renegeListItem.appendChild(renegeListItemTop)
                        var renegeListItemBottom = document.createElement("div")
                        renegeListItemBottom.classList.add("renegeListItemBottom")
                        var renegeListItemBottomContent = document.createElement("div")
                        renegeListItemBottomContent.classList.add("renegeListItemBottomContent")
                        var span = document.createElement("span")
                        span.classList.add("font-09-em")
                        span.innerText = "原因"
                        renegeListItemBottomContent.appendChild(span)
                        var span = document.createElement("span")
                        span.classList.add("renegeListRed")
                        span.classList.add("font-09-em")
                        span.innerText = response.data.list[i].renegeCategoryInfo
                        renegeListItemBottomContent.appendChild(span)
                        var renegeListTip = document.createElement("div")
                        renegeListTip.classList.add("renegeListTip")
                        renegeListTip.innerText = response.data.list[i].spaceDetailInfo.areaInfo.nameMerge + ":" + response.data.list[i].spaceDetailInfo.name
                        renegeListItemBottom.appendChild(renegeListItemBottomContent)
                        renegeListItemBottom.appendChild(renegeListTip)
                        renegeListItem.appendChild(renegeListItemBottom)
                        renegeList.appendChild(renegeListItem)
                    }
                    document.body.appendChild(renegeList)
                } else {
                    console.log("暂无违约记录")
                    alert("success", "暂无违约记录")
                }
            } else {
                if (response.msg == "没有登录或登录已超时") {
                    login_data = await login(localStorage.getItem("userid"), localStorage.getItem("userid"))
                    if (login_data.status == 1) {
                        showReneges()
                    } else {
                        window.location.href = "./login.html"
                    }
                } else {
                    alert("success", "暂无违约记录")
                }
            }

        })
        .catch(err => console.error(err));
}
