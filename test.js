const browser_simulator = require('./index');
const url = "https://";
(async function () {
    //实例化一个模拟器
    const executablePath = "/usr/bin/chromium-browser";
    const browser = new browser_simulator(true);
    //启动浏览器
    await browser.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
        executablePath,
        dumpio: true,
        headless: false
    });
    //打开指定网页
    let page;
    try {
        // page = await browser.open(url, [{
        //     url: "/static/pingbi.js",
        //     abort: true
        // }], null, 5000, true, true);
        page = await browser.open(url, null, null, 100, true, true);
    } catch (e) {
        console.warn("打开网页异常：", e);
    } finally {
        //关闭导航页
        page.completed && await page.close();
    }
    if (page && page.networks && page.networks.length) {
        // console.log("该网页的第一个请求", page.networks[0]);
        console.log("共" + page.networks.length + "个请求");
    } else {
        console.warn("no request");
    }
    //关闭浏览器
    await browser.close();
})();