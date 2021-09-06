const browser_simulator = require('./index');
const url = "https://";
(async function () {
    //实例化一个模拟器
    const executablePath = "/usr/bin/chromium-browser";
    const browser = new browser_simulator(executablePath);
    //启动浏览器
    await browser.launch();
    //打开指定网页
    let page;
    try {
        page = await browser.open(url, [{
            url: "/static/pingbi.js",
            abort: true
        }]);
    } catch (e) {
        console.warn("打开网页异常：", e);
    } finally {
        //关闭导航页
        page.completed && await page.close();
    }
    // console.log("该网页的所有请求", page.networks);
    //关闭浏览器
    await browser.close();
})();