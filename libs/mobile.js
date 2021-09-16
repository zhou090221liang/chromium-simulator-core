const iPhone = {
    "platform": "iPhone",
    "appCodeName": "Mozilla",
    "appName": "Netscape",
    "appVersion": "5.0 (iPhone; CPU iPhone OS 14_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1 Mobile/15E148 Safari/604.1",
    "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1 Mobile/15E148 Safari/604.1"
};
Object.defineProperty(navigator, 'platform', { get: function () { return iPhone.platform; } });
Object.defineProperty(navigator, 'appName', { get: function () { return iPhone.appName; } });
Object.defineProperty(navigator, 'appCodeName', { get: function () { return iPhone.appCodeName; } });
Object.defineProperty(navigator, 'appVersion', { get: function () { return iPhone.appVersion; } });