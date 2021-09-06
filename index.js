/*
Api文档：https://zhaoqize.github.io/puppeteer-api-zh_CN/#/
*/

const puppeteer = require('puppeteer-core');

module.exports = class {
    /**
     * 实例化一个浏览器对象
     * @param {String} executablePath 可运行 Chromium 或 Chrome 可执行文件的路径，而不是绑定的 Chromium。\
     * 如果 executablePath 是一个相对路径，那么他相对于 当前工作路径 解析。\
     * @param {Boolean} output 是否输出信息，默认false
     * @return {Object} 浏览器操作对象
     */
    constructor(executablePath, output = false) {
        this._executablePath = executablePath || puppeteer.executablePath();
        this._output = output != undefined ? output : false;
        this.launch = _launch;
        this.open = _open;
        this.close = _close;
    }
}

/**
 * 启动或重启浏览
 * @param {JSON} options 启动参数：可以包括：\
 * args:<Array<String>> 传递给浏览器实例的其他参数。默认['--no-sandbox', '--disable-setuid-sandbox']。\
 * 详情请参考：https://peter.sh/experiments/chromium-command-line-switches/
 * ignoreHTTPSErrors:<Boolean> 是否在导航期间忽略 HTTPS 错误. 默认是 true。\
 * headless:<Boolean> 是否以 无头模式 运行浏览器。默认是 true，除非 devtools 选项是 true。\
 * devtools:<Boolean> 是否为每个选项卡自动打开DevTools面板。如果这个选项是 true，headless 选项将会设置成 false。\
 * timeout:<Number> 等待浏览器实例启动的最长时间（以毫秒为单位）。默认是 30000 (30 秒). 通过 0 来禁用超时。
 */
async function _launch(options) {
    options = options || {};
    this._launchOptions = {
        args: options.args || ['--no-sandbox', '--disable-setuid-sandbox'],
        ignoreHTTPSErrors: options.ignoreHTTPSErrors != undefined ? options.ignoreHTTPSErrors : true,
        headless: options.headless != undefined ? options.headless : true,
        devtools: options.devtools != undefined ? options.devtools : false,
        executablePath: options.executablePath || (this._executablePath || null),
        timeout: options.timeout != undefined ? options.timeout : false,
        dumpio: options.dumpio != undefined ? options.dumpio : false,
    };
    if (this._browser) {
        await this._browser.close();
        this._output && console.info("退出浏览器完成");
    }
    this._browser = await puppeteer.launch(this._launchOptions);
    this._output && console.warn("浏览器已启动");
}

/**
 * 关闭浏览器，退出浏览器资源占用（调用该方法后，如需使用，需要重新启动浏览器）
 */
async function _close() {
    if (this._browser) {
        await this._browser.close();
        this._output && console.info("退出浏览器完成");
        this._browser = null;
    } else {
        this._output && console.warn("浏览器未启动");
    }
}

/**
 * 导航到指定网页，使用完毕后，如无需再使用，请调用page.close关闭导航页
 * @param {String} url 需要导航的网页地址
 * @param {Boolean} forceNetwork 强制返回已经请求的网络信息，哪怕出现请求异常，默认true
 * @param {Number} timeout 超时时间，单位毫秒。\
 * 当指定了waitFor参数，该参数代表waitFor的超时时间。\
 * 当未指定waitFor参数，该参数代表整体网页加载后等待的时间。
 * @param {String} waitFor 可以是一个Jquery选择器，也可以是一个事件监听器。\
 * 选择器：比如".xxx"或"#xxx"等。\
 * 事件监听器：\
 * load - 页面的load事件触发时 \
 * domcontentloaded - 页面的DOMContentLoaded事件触发时 \
 * networkidle0 - 不再有网络连接时触发（至少500毫秒后）\
 * networkidle2- 只有2个网络连接时触发（至少500毫秒后）\
 * @param {Array<JSON>} netWorkConfig 网络请求拦截器，可以包括： \
 * url - <String> - 拦截第请求，拦截器判断依据request.url.indexOf("xxxxx")>-1 \
 * abort - <Boolean> 直接终止该请求 \
 * responsed - <JOSN> 直接响应指定的信息，如： {status: 404, contentType: 'text/plain', body: 'Not Found!'} \
 * overrides - <JSON> 重定向请求，如：{url:"<string>重定向的url",method:"GET或POST",postData:"请求要提交的数据",headers:{}} \
 * 注意：abort或responsed或overrides只允许出现其中一个，overrides将重定向请求并继续发起请求，其他2种方式不会发起请求。
 * @returns <JSON> 包含page对象和network监听
 */
function _open(url, netWorkConfig = [], waitFor = null, timeout = 30000, forceNetwork = true) {
    const _self = this;
    const networks = [];
    let resolved = false;
    let page;
    return new Promise(async function (resolve, reject) {
        try {
            page = await _self._browser.newPage();
            _self._output && console.info("新建页面完成");
            await page.setRequestInterception(true);
            page.on('request', async (request) => {
                try {
                    networks.push({
                        request: {
                            headers: request.headers(),
                            method: request.method(),
                            postData: request.postData(),
                            resourceType: request.resourceType(),
                            url: request.url()
                        }
                    });
                    let interception = false, overrides = null;
                    for (let i = 0; i < netWorkConfig.length; i++) {
                        if (request.url().indexOf(netWorkConfig[i].url) > -1) {
                            if (netWorkConfig[i].responsed) {
                                interception = true;
                                await request.respond(netWorkConfig[i].responsed);
                            } else if (netWorkConfig[i].abort) {
                                interception = true;
                                await request.abort();
                            } else if (netWorkConfig[i].overrides) {
                                overrides = netWorkConfig[i].overrides;
                            }
                            break;
                        }
                    }
                    if (!interception) {
                        if (overrides) {
                            await request.continue(overrides);
                        } else {
                            await request.continue();
                        }
                    }
                } catch (e) {
                    throw e;
                }
            });
            page.on('response', async (response) => {
                try {
                    for (let i = 0; i < networks.length; i++) {
                        if (networks[i].request && networks[i].request.url == response.url() && networks[i].request.method == response.request().method()) {
                            networks[i].response = {};
                            networks[i].response.buffer = null;
                            try {
                                networks[i].response.buffer = await response.buffer();
                            } catch (e) { }
                            networks[i].response.headers = response.headers();
                            networks[i].response.ok = response.ok();
                            networks[i].response.remoteAddress = response.remoteAddress();
                            networks[i].response.securityDetails = response.securityDetails();
                            networks[i].response.status = response.status();
                            networks[i].response.statusText = response.statusText();
                            networks[i].response.text = null;
                            networks[i].response.json = null;
                            try {
                                networks[i].response.text = await response.text();
                                try {
                                    networks[i].response.json = JSON.parse(networks[i].response.text);
                                } catch (e) { }
                            } catch (e) { }
                            break;
                        }
                    }
                } catch (e) {
                    throw e;
                }
            });
            _self._output && console.info(`准备打开网址：${url}`);
            await page.goto(url, { waitUntil: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'] });
            if (timeout != undefined && waitFor == undefined) {
                await page.waitFor(timeout);
                if (!resolved) {
                    page.completed = true;
                    page.networks = networks;
                    resolve([page]);
                    resolved = true;
                }
            } else {
                timeout = timeout || 30000;
                if (waitFor == 'load' || waitFor == 'domcontentloaded' || waitFor == 'networkidle0' || waitFor == 'networkidle2') {
                    await page.waitForNavigation({
                        timeout,
                        waitUntil: waitFor
                    });
                    if (!resolved) {
                        page.completed = true;
                        page.networks = networks;
                        resolve(page);
                        resolved = true;
                    }
                } else {
                    await page.waitForSelector(waitFor, {
                        timeout
                    });
                    if (!resolved) {
                        page.completed = true;
                        page.networks = networks;
                        resolve(page);
                        resolved = true;
                    }
                }
            }
        } catch (e) {
            if (!forceNetwork) {
                reject(e);
            } else {
                if (!resolved) {
                    if (page) {
                        page.close();
                    }
                    resolve({ networks, completed: false, error: e });
                    resolved = true;
                }
            }
        }
    });
}