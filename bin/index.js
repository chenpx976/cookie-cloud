#!/usr/bin/env node

const fse = require('fs-extra');
const path = require('path');
const CookieManager = require('../dist/cookie-cloud.cjs.development').default;
console.log('custom-debug:CookieManager', CookieManager);


const ConfigManager = require('dot-config-next').default;
const configManager = new ConfigManager('cookie-cloud');
const config = configManager.readConfig();
const cookieManager = new CookieManager(config);

// domain 从命令行参数获取
const domain = process.argv[2];
(async () => {
  const cookie = await cookieManager.getCookes(domain);
  require('fs').writeFileSync('./cookie.json', JSON.stringify(cookie, null, 2));
  console.log('custom-debug:cookie', cookie);
})();
