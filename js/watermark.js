var path = ""


function watermark() {
    if (!document.body) {
        document.addEventListener('DOMContentLoaded', watermark);
    } else {
        var overlay = document.createElement("div");
        overlay.classList.add("watermark-overlay");
        var text = document.createElement("div");
        text.classList.add("watermark-text");
        text.textContent = "图书馆预约助手\n" + localStorage.getItem('name');
        overlay.appendChild(text);
        document.body.appendChild(overlay);
        console.log("创建水印");
    }
}
watermark()

function alert(msgtype, msg) {
    errorModalmodal = $("<div></div>").addClass("errorModalmodal").attr("id", "errorModal")
    errorModalmodal_content = $("<div></div>").addClass("errorModalmodal-content")
    span = $("<span></span>").addClass("errorModalclose").attr("onclick", "errorModalcloseModal()").text("×")
    p = $("<p></p>")
    if (msgtype == "error") {
        p.css("color", "red")
        h2 = $("<h2></h2>").text("发生了一些错误").css("color", "red")
    } else {
        p.css("color", "green")
        h2 = $("<h2></h2>").text("提示").css("color", "green")
    }
    p = p.text(msg)
    errorModalmodal_content.append(span)
    errorModalmodal_content.append(h2)
    errorModalmodal_content.append(p)
    errorModalmodal.append(errorModalmodal_content)
    $("body").append(errorModalmodal)
    errorModalopenModal()
}

function errorModalopenModal() {
    $("#errorModal").css("display", "block")
}

function errorModalcloseModal() {
    $("#errorModal").css("display", "none")
}

// 获取滚动条宽度
function getScrollbarWidth() {
    // 创建一个元素以便测量滚动条宽度
    const scrollDiv = document.createElement('div');
    scrollDiv.style.width = '100px';
    scrollDiv.style.height = '100px';
    scrollDiv.style.overflow = 'scroll';
    scrollDiv.style.position = 'absolute';
    scrollDiv.style.top = '-9999px';
    document.body.appendChild(scrollDiv);
    const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    document.body.removeChild(scrollDiv);
    return scrollbarWidth;
}

// 更新 VW 值
function updateVW() {
    const vwValue = window.innerWidth - getScrollbarWidth();
    document.documentElement.style.setProperty('--adjusted-vw', `${vwValue}px`);
}

// 初始化和在滚动事件上调整 VW 值
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded');
    updateVW(); // 页面加载时更新一次
    window.addEventListener('resize', updateVW); // 窗口调整大小时更新
    window.addEventListener('scroll', updateVW); // 滚动时更新
});


function getUrlParams(name) { // 不传name返回所有值，否则返回对应值
    var url = window.location.search;
    if (url.indexOf('?') == 1) { return false; }
    url = url.substr(1);
    url = url.split('&');
    var name = name || '';
    var nameres;
    // 获取全部参数及其值
    for(var i=0;i<url.length;i++) {
        var info = url[i].split('=');
        var obj = {};
        obj[info[0]] = decodeURI(info[1]);
        url[i] = obj;
    }
    // 如果传入一个参数名称，就匹配其值
    if (name) {
        for(var i=0;i<url.length;i++) {
            for (const key in url[i]) {
                if (key == name) {
                    nameres = url[i][key];
                }
            }
        }
    } else {
        nameres = url;
    }
    // 返回结果
    return nameres;
}